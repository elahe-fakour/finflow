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

type AuditEventFilters = {
  action?: string;
  actor?: string;
  from?: string;
  page: number;
  to?: string;
};

async function getAuditEvents(
  workspaceId: string,
  filters: AuditEventFilters,
): Promise<PaginatedAuditEvents | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(sessionCookieName);
  const headers = new Headers();

  if (sessionCookie !== undefined) {
    headers.set("Cookie", `${sessionCookieName}=${sessionCookie.value}`);
  }

  const query = new URLSearchParams({ page: String(filters.page), pageSize: "25" });

  for (const key of ["action", "actor", "from", "to"] as const) {
    const value = filters[key];
    if (value !== undefined && value !== "") query.set(key, value);
  }

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
export type { AuditEvent, AuditEventFilters, PaginatedAuditEvents };
