const LOCAL_WEB_ORIGIN = "http://localhost:3000";

/**
 * Resolves the browser origin trusted by the API's session and CORS policy.
 * Production must be explicit and HTTPS; development keeps a localhost default.
 */
export function getTrustedWebOrigins(): string[] {
  const configuredOrigin = process.env.WEB_ORIGIN?.trim();
  const isProduction = process.env.NODE_ENV?.trim().toLowerCase() === "production";

  if (configuredOrigin === undefined || configuredOrigin.length === 0) {
    if (isProduction) {
      throw new Error("WEB_ORIGIN must be configured with an HTTPS origin in production.");
    }

    return [LOCAL_WEB_ORIGIN];
  }

  const origin = parseOrigin(configuredOrigin);
  if (isProduction && origin.protocol !== "https:") {
    throw new Error("WEB_ORIGIN must use HTTPS in production.");
  }

  return [origin.origin];
}

/**
 * Keeps the session cookie policy explicit at the authentication boundary.
 * The `__Host-` cookie name used by the module requires these attributes.
 */
export function getSessionCookieOptions(): {
  secure: true;
  sameSite: "lax";
  path: "/";
} {
  return {
    secure: true,
    sameSite: "lax",
    path: "/",
  };
}

function parseOrigin(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("WEB_ORIGIN must be a valid absolute origin URL.");
  }

  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("WEB_ORIGIN must contain only a scheme, host, and optional port.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("WEB_ORIGIN must use HTTP or HTTPS.");
  }

  return url;
}
