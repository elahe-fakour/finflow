import type { NextRequest } from "next/server";
import { getApiUrl } from "./api-url";
import { sessionCookieName } from "./session-cookie";

async function forwardAuthJsonRequest(request: NextRequest, path: string): Promise<Response> {
  if (!isSameOriginWrite(request)) {
    return forbiddenCrossOriginResponse();
  }

  const body = await request.text();
  const headers = createSessionHeaders(request);
  headers.set("Content-Type", request.headers.get("Content-Type") ?? "application/json");

  return forwardResponse(
    fetch(getApiUrl(path), {
      body,
      cache: "no-store",
      headers,
      method: "POST",
    }),
  );
}

async function forwardLogoutRequest(request: NextRequest): Promise<Response> {
  if (!isSameOriginWrite(request)) {
    return forbiddenCrossOriginResponse();
  }

  return forwardResponse(
    fetch(getApiUrl("/api/v1/auth/logout"), {
      cache: "no-store",
      headers: createSessionHeaders(request),
      method: "POST",
    }),
  );
}

function isSameOriginWrite(request: NextRequest): boolean {
  return request.headers.get("Origin") === request.nextUrl.origin;
}

function forbiddenCrossOriginResponse(): Response {
  return Response.json(
    {
      code: "CROSS_ORIGIN_REQUEST_FORBIDDEN",
      message: "Cross-origin authentication requests are not allowed.",
    },
    { status: 403 },
  );
}

function createSessionHeaders(request: NextRequest): Headers {
  const headers = new Headers();
  const sessionCookie = request.cookies.get(sessionCookieName);

  if (sessionCookie !== undefined) {
    headers.set("Cookie", `${sessionCookieName}=${sessionCookie.value}`);
  }

  return headers;
}

async function forwardResponse(apiResponse: Promise<Response>): Promise<Response> {
  try {
    const response = await apiResponse;
    const headers = new Headers();
    const contentType = response.headers.get("Content-Type");

    if (contentType !== null) {
      headers.set("Content-Type", contentType);
    }

    for (const cookie of response.headers.getSetCookie()) {
      headers.append("Set-Cookie", cookie);
    }

    return new Response(response.body, { headers, status: response.status });
  } catch {
    return Response.json(
      {
        code: "AUTH_SERVICE_UNAVAILABLE",
        message: "Authentication is temporarily unavailable. Please try again.",
      },
      { status: 503 },
    );
  }
}

export { forwardAuthJsonRequest, forwardLogoutRequest };
