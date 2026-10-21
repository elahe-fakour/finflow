import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import {
  getAuditEvents,
  type AuditEvent,
  type AuditEventFilters,
} from "@/lib/audit-events/audit-events";
import { getActiveWorkspace } from "@/lib/workspaces/current-workspace";
import { ClipboardList, FolderPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Audit Log",
  description: "Review important activity recorded for your FinFlow workspace.",
};

type SettingsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const workspace = await getActiveWorkspace();

  if (workspace === null) {
    return (
      <section aria-labelledby="settings-title">
        <PageHeader />
        <EmptyState
          action={
            <Button asChild>
              <Link href="/onboarding">Create workspace</Link>
            </Button>
          }
          className="mt-8"
          description="A workspace is required before audit activity can be viewed."
          icon={FolderPlus}
          title="No workspace available"
        />
      </section>
    );
  }

  const filters = parseAuditEventFilters(await searchParams);
  const auditEvents = await getAuditEvents(workspace.id, filters);

  return (
    <section aria-labelledby="settings-title" className="space-y-8">
      <PageHeader workspaceName={workspace.name} />
      {workspace.role === "OWNER" || workspace.role === "ADMIN" ? (
        <Button asChild variant="outline">
          <Link href="/settings/members">Manage workspace members</Link>
        </Button>
      ) : null}
      <AuditEventFilters filters={filters} />
      {auditEvents === null ? (
        <ErrorState
          className="mt-8"
          description="We couldn't load audit activity for this workspace. Please try again shortly."
        />
      ) : auditEvents.data.length === 0 ? (
        <EmptyState
          className="mt-8"
          description="Important workspace activity will appear here as it happens."
          icon={ClipboardList}
          title="No audit events yet"
        />
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader className="border-b">
              <CardTitle as="h2">Recent activity</CardTitle>
              <p className="text-sm text-muted-foreground">
                {auditEvents.totalItems} recorded event{auditEvents.totalItems === 1 ? "" : "s"}
              </p>
            </CardHeader>
            <CardContent className="divide-y divide-border p-0">
              {auditEvents.data.map((event) => (
                <AuditEventRow event={event} key={event.id} />
              ))}
            </CardContent>
          </Card>
          <Pagination
            filters={filters}
            page={auditEvents.page}
            totalPages={auditEvents.totalPages}
          />
        </div>
      )}
    </section>
  );
}

function PageHeader({ workspaceName }: { workspaceName?: string }) {
  return (
    <header className="space-y-2">
      <p className="text-sm font-medium text-primary">Workspace controls</p>
      <h1
        className="text-page-title font-semibold tracking-tight text-foreground sm:text-display"
        id="settings-title"
      >
        Audit log
      </h1>
      <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
        Review important actions recorded for your FinFlow workspace.
        {workspaceName ? ` Workspace: ${workspaceName}.` : ""}
      </p>
    </header>
  );
}

function AuditEventRow({ event }: { event: AuditEvent }) {
  return (
    <article className="space-y-3 px-5 py-4 first:pt-5 last:pb-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">{formatAction(event.action)}</p>
          <p className="text-sm text-muted-foreground">
            {event.actor.displayName ?? event.actor.email} · {event.entity} · {event.entityId}
          </p>
        </div>
        <time className="text-sm text-muted-foreground" dateTime={event.createdAt}>
          {formatDate(event.createdAt)}
        </time>
      </div>
      <pre className="overflow-x-auto rounded-lg bg-muted/60 p-3 text-xs whitespace-pre-wrap text-muted-foreground">
        {formatMetadata(event.metadata)}
      </pre>
    </article>
  );
}

function AuditEventFilters({ filters }: { filters: AuditEventFilters }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle as="h2">Filters</CardTitle>
        <p className="text-sm text-muted-foreground">
          Narrow activity by operation, actor, or date.
        </p>
      </CardHeader>
      <CardContent>
        <form action="/settings" className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <FilterField id="audit-action" label="Action">
            <select
              className={inputClassName}
              defaultValue={filters.action ?? ""}
              id="audit-action"
              name="action"
            >
              <option value="">All actions</option>
              <option value="RECONCILIATION_CONFIRMED">Reconciliation confirmed</option>
            </select>
          </FilterField>
          <FilterField id="audit-actor" label="Actor">
            <input
              className={inputClassName}
              defaultValue={filters.actor ?? ""}
              id="audit-actor"
              maxLength={255}
              name="actor"
              placeholder="Name or email"
              type="search"
            />
          </FilterField>
          <FilterField id="audit-from" label="From">
            <input
              className={inputClassName}
              defaultValue={filters.from ?? ""}
              id="audit-from"
              name="from"
              type="date"
            />
          </FilterField>
          <FilterField id="audit-to" label="To">
            <input
              className={inputClassName}
              defaultValue={filters.to ?? ""}
              id="audit-to"
              name="to"
              type="date"
            />
          </FilterField>
          <div className="flex items-end gap-2">
            <Button className="flex-1" type="submit">
              Apply filters
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href="/settings">Clear</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function FilterField({
  children,
  id,
  label,
}: {
  children: React.ReactNode;
  id: string;
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClassName =
  "h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function Pagination({
  filters,
  page,
  totalPages,
}: {
  filters: AuditEventFilters;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Audit log pages" className="flex items-center justify-between gap-3">
      <Button asChild disabled={page <= 1} variant="outline">
        <Link aria-disabled={page <= 1} href={createAuditLogPath(filters, page > 1 ? page - 1 : 1)}>
          Previous
        </Link>
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <Button asChild disabled={page >= totalPages} variant="outline">
        <Link
          aria-disabled={page >= totalPages}
          href={createAuditLogPath(filters, page < totalPages ? page + 1 : totalPages)}
        >
          Next
        </Link>
      </Button>
    </nav>
  );
}

function parseAuditEventFilters(
  searchParams: Record<string, string | string[] | undefined>,
): AuditEventFilters {
  return {
    action: getParameter(searchParams.action),
    actor: getParameter(searchParams.actor),
    from: getDateParameter(searchParams.from),
    page: parsePage(getParameter(searchParams.page)),
    to: getDateParameter(searchParams.to),
  };
}

function createAuditLogPath(filters: AuditEventFilters, page: number) {
  const query = new URLSearchParams();
  for (const key of ["action", "actor", "from", "to"] as const) {
    const value = filters[key];
    if (value !== undefined) query.set(key, value);
  }
  if (page > 1) query.set("page", String(page));
  const serialized = query.toString();
  return serialized === "" ? "/settings" : `/settings?${serialized}`;
}

function parsePage(value: string | undefined) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function getParameter(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getDateParameter(value: string | string[] | undefined) {
  const parameter = getParameter(value);
  return parameter !== undefined && /^\d{4}-\d{2}-\d{2}$/u.test(parameter) ? parameter : undefined;
}

function formatAction(action: string) {
  return action
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatMetadata(metadata: unknown) {
  try {
    const serialized = JSON.stringify(metadata, null, 2);
    return serialized.length > 500 ? `${serialized.slice(0, 500)}…` : serialized;
  } catch {
    return "No additional metadata";
  }
}
