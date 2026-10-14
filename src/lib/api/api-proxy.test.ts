import { forwardApiRequest } from "./api-proxy";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("API BFF writes", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("forwards a same-origin category create with only the session cookie", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "category-1", name: "Consulting" }), {
        headers: { "Content-Type": "application/json" },
        status: 201,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const request = new NextRequest(
      "http://localhost:3000/api/workspaces/workspace-1/income-expense-categories",
      {
        body: JSON.stringify({ name: "Consulting", type: "INCOME" }),
        headers: {
          "Content-Type": "application/json",
          Cookie: "__Host-sid=active-session; unrelated=value",
          "Idempotency-Key": "e3268a34-1814-41d1-904f-2328b67d473a",
          Origin: "http://localhost:3000",
        },
        method: "POST",
      },
    );

    const response = await forwardApiRequest(
      request,
      "/api/v1/workspaces/workspace-1/income-expense-categories",
      "POST",
    );
    const [, requestOptions] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/api/v1/workspaces/workspace-1/income-expense-categories",
      expect.any(Object),
    );
    expect(new Headers(requestOptions.headers).get("Cookie")).toBe("__Host-sid=active-session");
    expect(new Headers(requestOptions.headers).get("Idempotency-Key")).toBe(
      "e3268a34-1814-41d1-904f-2328b67d473a",
    );
    expect(requestOptions.body).toBe(JSON.stringify({ name: "Consulting", type: "INCOME" }));
    expect(await response.json()).toEqual({ id: "category-1", name: "Consulting" });
  });

  it("rejects a cross-origin write before it reaches the API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const request = new NextRequest("http://localhost:3000/api/workspaces/workspace-1", {
      headers: { Origin: "https://malicious.example" },
      method: "DELETE",
    });

    const response = await forwardApiRequest(request, "/api/v1/workspaces/workspace-1", "DELETE");

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      code: "CROSS_ORIGIN_REQUEST_FORBIDDEN",
      message: "Cross-origin write requests are not allowed.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns a safe response when the API is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Connection refused")));
    const request = new NextRequest("http://localhost:3000/api/workspaces/workspace-1", {
      headers: { Origin: "http://localhost:3000" },
      method: "DELETE",
    });

    const response = await forwardApiRequest(request, "/api/v1/workspaces/workspace-1", "DELETE");

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      code: "API_SERVICE_UNAVAILABLE",
      message: "The API is temporarily unavailable. Please try again.",
    });
  });
});
