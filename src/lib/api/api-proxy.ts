import type { NextRequest } from "next/server";
import { getApiUrl } from "@/lib/auth/api-url";
import { sessionCookieName } from "@/lib/auth/session-cookie";

type ApiRequestMethod = "DELETE" | "PATCH" | "POST";

async function forwardApiRequest(
  request: NextRequest,
  path: string,
  method: ApiRequestMethod,
): Promise<Response> {
  if (!isSameOriginWrite(request)) {
    return forbiddenCrossOriginResponse();
  }

  const headers = createSessionHeaders(request);
  const contentType = request.headers.get("Content-Type");

  if (contentType !== null) {
    headers.set("Content-Type", contentType);
  }

  const body = method === "DELETE" ? undefined : await request.text();

  try {
    const response = await fetch(getApiUrl(path), {
      body,
      cache: "no-store",
      headers,
      method,
    });

    const responseHeaders = new Headers();
    const responseContentType = response.headers.get("Content-Type");

    if (responseContentType !== null) {
      responseHeaders.set("Content-Type", responseContentType);
    }

    return new Response(response.body, { headers: responseHeaders, status: response.status });
  } catch {
    return Response.json(
      {
        code: "API_SERVICE_UNAVAILABLE",
        message: "The API is temporarily unavailable. Please try again.",
      },
      { status: 503 },
    );
  }
}

function isSameOriginWrite(request: NextRequest): boolean {
  return request.headers.get("Origin") === request.nextUrl.origin;
}

function forbiddenCrossOriginResponse(): Response {
  return Response.json(
    {
      code: "CROSS_ORIGIN_REQUEST_FORBIDDEN",
      message: "Cross-origin write requests are not allowed.",
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

export { forwardApiRequest };
