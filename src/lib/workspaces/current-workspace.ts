import "server-only";

import { getApiUrl } from "@/lib/auth/api-url";
import { sessionCookieName } from "@/lib/auth/session-cookie";
import { cookies } from "next/headers";
import { cache } from "react";

type WorkspaceRole = "ACCOUNTANT" | "ADMIN" | "MEMBER" | "OWNER";

type AccessibleWorkspace = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  role: WorkspaceRole;
};

const getActiveWorkspace = cache(async (): Promise<AccessibleWorkspace | null> => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(sessionCookieName);
  const headers = new Headers();

  if (sessionCookie !== undefined) {
    headers.set("Cookie", `${sessionCookieName}=${sessionCookie.value}`);
  }

  try {
    const response = await fetch(getApiUrl("/api/v1/workspaces"), {
      cache: "no-store",
      headers,
    });

    if (!response.ok) {
      return null;
    }

    const workspaces = (await response.json()) as AccessibleWorkspace[];

    return workspaces[0] ?? null;
  } catch {
    return null;
  }
});

export { getActiveWorkspace };
export type { AccessibleWorkspace };
