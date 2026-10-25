"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

function AcceptInvitationForm({ token }: { token: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function accept() {
    setMessage(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/workspaces/invitations/${token}/accept`, {
          method: "POST",
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { message?: string } | null;
          setMessage(payload?.message ?? "This invitation could not be accepted.");
          return;
        }
        setMessage("Invitation accepted. Redirecting to your workspace…");
        router.replace("/");
        router.refresh();
      } catch {
        setMessage("We couldn't reach FinFlow. Please try again.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <Button disabled={isPending} onClick={accept} size="lg">
        {isPending ? "Accepting…" : "Accept invitation"}
      </Button>
      {message ? (
        <p className="text-sm text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}

export { AcceptInvitationForm };
