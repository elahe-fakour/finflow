import "server-only";

import { getApiUrl } from "@/lib/auth/api-url";
import { sessionCookieName } from "@/lib/auth/session-cookie";
import { cookies } from "next/headers";

type WorkspaceMember = {
  createdAt: string;
  displayName: string | null;
  email: string;
  role: "ACCOUNTANT" | "ADMIN" | "MEMBER" | "OWNER";
  userId: string;
};

async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[] | null> {
  const sessionCookie = (await cookies()).get(sessionCookieName);
  const headers = new Headers();

  if (sessionCookie !== undefined) {
    headers.set("Cookie", `${sessionCookieName}=${sessionCookie.value}`);
  }

  try {
    const response = await fetch(
      getApiUrl(`/api/v1/workspaces/${encodeURIComponent(workspaceId)}/members`),
      { cache: "no-store", headers },
    );

    if (!response.ok) return null;
    return (await response.json()) as WorkspaceMember[];
  } catch {
    return null;
  }
}

export { getWorkspaceMembers };
export type { WorkspaceMember };
