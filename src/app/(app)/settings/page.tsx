import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { getAuditEvents, type AuditEvent } from "@/lib/audit-events/audit-events";
import { getActiveWorkspace } from "@/lib/workspaces/current-workspace";
import { ClipboardList, FolderPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Audit Log",
  description: "Review important activity recorded for your FinFlow workspace.",
};

type SettingsPageProps = {
  searchParams: Promise<{ page?: string }>;
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

  const page = parsePage((await searchParams).page);
  const auditEvents = await getAuditEvents(workspace.id, page);

  return (
    <section aria-labelledby="settings-title" className="space-y-8">
      <PageHeader workspaceName={workspace.name} />
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
          <Pagination page={auditEvents.page} totalPages={auditEvents.totalPages} />
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

function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Audit log pages" className="flex items-center justify-between gap-3">
      <Button asChild disabled={page <= 1} variant="outline">
        <Link aria-disabled={page <= 1} href={page > 1 ? `?page=${page - 1}` : "?page=1"}>
          Previous
        </Link>
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <Button asChild disabled={page >= totalPages} variant="outline">
        <Link
          aria-disabled={page >= totalPages}
          href={page < totalPages ? `?page=${page + 1}` : `?page=${totalPages}`}
        >
          Next
        </Link>
      </Button>
    </nav>
  );
}

function parsePage(value: string | undefined) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
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
