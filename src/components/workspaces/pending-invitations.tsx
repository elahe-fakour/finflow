"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WorkspaceInvitation } from "@/lib/workspaces/workspace-invitations";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

function PendingInvitations({
  invitations,
  workspaceId,
}: {
  invitations: WorkspaceInvitation[];
  workspaceId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function revoke(invitationId: string) {
    if (!window.confirm("Revoke this invitation?")) return;
    startTransition(async () => {
      await fetch(`/api/workspaces/${workspaceId}/invitations/${invitationId}/revoke`, {
        method: "POST",
      });
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle as="h2">Pending invitations</CardTitle>
        <p className="text-sm text-muted-foreground">{invitations.length} awaiting acceptance</p>
      </CardHeader>
      <CardContent className="divide-y divide-border p-0">
        {invitations.map((invitation) => (
          <article
            className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
            key={invitation.id}
          >
            <div>
              <p className="font-medium text-foreground">{invitation.email}</p>
              <p className="text-sm text-muted-foreground">
                {invitation.role.charAt(0) + invitation.role.slice(1).toLowerCase()} · Expires{" "}
                {new Date(invitation.expiresAt).toLocaleDateString("en-US")}
              </p>
            </div>
            <Button disabled={isPending} onClick={() => revoke(invitation.id)} variant="outline">
              Revoke
            </Button>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}

export { PendingInvitations };
