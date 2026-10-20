import "server-only";

import { getApiUrl } from "@/lib/auth/api-url";
import { sessionCookieName } from "@/lib/auth/session-cookie";
import { cookies } from "next/headers";

type AuditEvent = {
  action: string;
  actor: { displayName: string | null; email: string };
  createdAt: string;
  entity: string;
  entityId: string;
  id: string;
  metadata: unknown;
};

type PaginatedAuditEvents = {
  data: AuditEvent[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

async function getAuditEvents(
  workspaceId: string,
  page = 1,
  pageSize = 25,
): Promise<PaginatedAuditEvents | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(sessionCookieName);
  const headers = new Headers();

  if (sessionCookie !== undefined) {
    headers.set("Cookie", `${sessionCookieName}=${sessionCookie.value}`);
  }

  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });

  try {
    const response = await fetch(
      getApiUrl(
        `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/audit-events?${query.toString()}`,
      ),
      { cache: "no-store", headers },
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as PaginatedAuditEvents;
  } catch {
    return null;
  }
}

export { getAuditEvents };
export type { AuditEvent, PaginatedAuditEvents };
