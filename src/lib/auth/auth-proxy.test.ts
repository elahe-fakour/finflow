import { forwardAuthJsonRequest, forwardLogoutRequest } from "./auth-proxy";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("authentication BFF routes", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("forwards a same-origin login and returns the API's session cookie", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ email: "owner@acme.example" }), {
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": "__Host-sid=new-session; HttpOnly; Secure; SameSite=Lax; Path=/",
        },
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      body: JSON.stringify({ email: "owner@acme.example", password: "a secure passphrase" }),
      headers: {
        "Content-Type": "application/json",
        Cookie: "__Host-sid=old-session; unrelated=value",
        Origin: "http://localhost:3000",
      },
      method: "POST",
    });

    const response = await forwardAuthJsonRequest(request, "/api/v1/auth/login");
    const [, requestOptions] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(requestOptions.headers);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/api/v1/auth/login",
      expect.any(Object),
    );
    expect(headers.get("Cookie")).toBe("__Host-sid=old-session");
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(await response.json()).toEqual({ email: "owner@acme.example" });
    expect(response.headers.getSetCookie()).toEqual([
      "__Host-sid=new-session; HttpOnly; Secure; SameSite=Lax; Path=/",
    ]);
  });

  it("forwards only the session cookie when a same-origin logout is requested", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, {
        headers: { "Set-Cookie": "__Host-sid=; Max-Age=0; Path=/" },
        status: 204,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const request = new NextRequest("http://localhost:3000/api/auth/logout", {
      headers: {
        Cookie: "__Host-sid=active-session; unrelated=value",
        Origin: "http://localhost:3000",
      },
      method: "POST",
    });

    const response = await forwardLogoutRequest(request);
    const [, requestOptions] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(new Headers(requestOptions.headers).get("Cookie")).toBe("__Host-sid=active-session");
    expect(response.status).toBe(204);
    expect(response.headers.getSetCookie()).toEqual(["__Host-sid=; Max-Age=0; Path=/"]);
  });

  it("allows the explicitly configured local development origin", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const request = new NextRequest("http://localhost:3000/api/auth/logout", {
      headers: { Origin: "http://10.170.169.8:3000" },
      method: "POST",
    });

    await forwardLogoutRequest(request);

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("rejects an authentication write from another origin before it reaches the API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      headers: { Origin: "https://malicious.example" },
      method: "POST",
    });

    const response = await forwardAuthJsonRequest(request, "/api/v1/auth/login");

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      code: "CROSS_ORIGIN_REQUEST_FORBIDDEN",
      message: "Cross-origin authentication requests are not allowed.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns a safe error when the API is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Connection refused")));
    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      headers: { Origin: "http://localhost:3000" },
      method: "POST",
    });

    const response = await forwardAuthJsonRequest(request, "/api/v1/auth/login");

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      code: "AUTH_SERVICE_UNAVAILABLE",
      message: "Authentication is temporarily unavailable. Please try again.",
    });
  });
});
