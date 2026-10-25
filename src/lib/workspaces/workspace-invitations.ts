import "server-only";

import { getApiUrl } from "@/lib/auth/api-url";
import { sessionCookieName } from "@/lib/auth/session-cookie";
import { cookies } from "next/headers";

type WorkspaceInvitation = {
  acceptedAt: string | null;
  email: string;
  expiresAt: string;
  id: string;
  role: "ACCOUNTANT" | "ADMIN" | "MEMBER";
  revokedAt: string | null;
  workspaceId: string;
};

async function getPendingInvitations(workspaceId: string): Promise<WorkspaceInvitation[] | null> {
  const sessionCookie = (await cookies()).get(sessionCookieName);
  const headers = new Headers();
  if (sessionCookie) headers.set("Cookie", `${sessionCookieName}=${sessionCookie.value}`);

  try {
    const response = await fetch(
      getApiUrl(`/api/v1/workspaces/${encodeURIComponent(workspaceId)}/invitations`),
      { cache: "no-store", headers },
    );
    return response.ok ? ((await response.json()) as WorkspaceInvitation[]) : null;
  } catch {
    return null;
  }
}

export { getPendingInvitations };
export type { WorkspaceInvitation };
