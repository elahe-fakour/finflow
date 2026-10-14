import type { NextRequest } from "next/server";

const localDevelopmentOrigins = new Set(["http://10.170.169.8:3000"]);

function isTrustedWriteOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("Origin");

  if (origin === request.nextUrl.origin) return true;

  return process.env.NODE_ENV === "development" && localDevelopmentOrigins.has(origin ?? "");
}

export { isTrustedWriteOrigin };
