const defaultAuthenticatedPath = "/";

function getSafeRedirectPath(value: string | string[] | undefined): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    value.includes("\r") ||
    value.includes("\n")
  ) {
    return defaultAuthenticatedPath;
  }

  return value;
}

function createLoginPath(nextPath: string): string {
  return `/login?next=${encodeURIComponent(nextPath)}`;
}

export { createLoginPath, getSafeRedirectPath };
