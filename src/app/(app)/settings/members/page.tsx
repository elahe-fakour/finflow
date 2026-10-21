import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { getWorkspaceMembers, type WorkspaceMember } from "@/lib/workspaces/workspace-members";
import { getActiveWorkspace } from "@/lib/workspaces/current-workspace";
import { FolderPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Workspace Members",
  description: "Review workspace members and their FinFlow roles.",
};

export default async function WorkspaceMembersPage() {
  const workspace = await getActiveWorkspace();

  if (workspace === null) {
    return (
      <section aria-labelledby="members-title">
        <PageHeader />
        <EmptyState
          action={
            <Button asChild>
              <Link href="/onboarding">Create workspace</Link>
            </Button>
          }
          className="mt-8"
          description="A workspace is required before members can be viewed."
          icon={FolderPlus}
          title="No workspace available"
        />
      </section>
    );
  }

  const members = await getWorkspaceMembers(workspace.id);

  return (
    <section aria-labelledby="members-title" className="space-y-8">
      <PageHeader workspaceName={workspace.name} />
      {members === null ? (
        <ErrorState
          className="mt-8"
          description="You may not have permission to view members, or the workspace service is unavailable."
        />
      ) : (
        <MemberList members={members} />
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
        id="members-title"
      >
        Workspace members
      </h1>
      <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
        Review who can access this workspace and which role they hold.
        {workspaceName ? ` Workspace: ${workspaceName}.` : ""}
      </p>
    </header>
  );
}

function MemberList({ members }: { members: WorkspaceMember[] }) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle as="h2">Members</CardTitle>
        <p className="text-sm text-muted-foreground">
          {members.length} workspace member{members.length === 1 ? "" : "s"}
        </p>
      </CardHeader>
      <CardContent className="divide-y divide-border p-0">
        {members.map((member) => (
          <article
            className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
            key={member.userId}
          >
            <div>
              <p className="font-medium text-foreground">{member.displayName ?? member.email}</p>
              <p className="text-sm text-muted-foreground">{member.email}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-primary">{formatRole(member.role)}</p>
              <p className="text-xs text-muted-foreground">Joined {formatDate(member.createdAt)}</p>
            </div>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}

function formatRole(role: WorkspaceMember["role"]) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value));
}
