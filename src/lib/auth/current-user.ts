import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getApiUrl } from "./api-url";
import type { AuthenticatedUser } from "./auth-types";
import { sessionCookieName } from "./session-cookie";

const getCurrentUser = cache(async (): Promise<AuthenticatedUser | null> => {
  const sessionCookie = (await cookies()).get(sessionCookieName);

  if (sessionCookie === undefined) {
    return null;
  }

  let response: Response;

  try {
    response = await fetch(getApiUrl("/api/v1/auth/me"), {
      cache: "no-store",
      headers: {
        Cookie: `${sessionCookieName}=${sessionCookie.value}`,
      },
    });
  } catch {
    throw new Error("FinFlow's authentication service is unavailable.");
  }

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("FinFlow's authentication service returned an unexpected response.");
  }

  const user: unknown = await response.json();

  if (!isAuthenticatedUser(user)) {
    throw new Error("FinFlow's authentication service returned an invalid user response.");
  }

  return user;
});

const requireCurrentUser = cache(async (): Promise<AuthenticatedUser> => {
  const user = await getCurrentUser();

  if (user === null) {
    redirect("/login?reason=session-expired");
  }

  return user;
});

function isAuthenticatedUser(value: unknown): value is AuthenticatedUser {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const user = value as Record<string, unknown>;

  return (
    typeof user.id === "string" &&
    typeof user.email === "string" &&
    (typeof user.displayName === "string" || user.displayName === null)
  );
}

export { getCurrentUser, requireCurrentUser };
