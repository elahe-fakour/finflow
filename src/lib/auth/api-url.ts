const localApiBaseUrl = "http://localhost:3001";

function getApiBaseUrl(): string {
  const configuredBaseUrl = process.env.API_BASE_URL?.trim();

  if (configuredBaseUrl !== undefined && configuredBaseUrl !== "") {
    return configuredBaseUrl.replace(/\/$/, "");
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("API_BASE_URL must be configured in production.");
  }

  return localApiBaseUrl;
}

function getApiUrl(path: string): string {
  return new URL(path, `${getApiBaseUrl()}/`).toString();
}

export { getApiUrl };
