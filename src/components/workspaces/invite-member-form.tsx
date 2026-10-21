"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

type InviteMemberFormProps = { workspaceId: string };
type ApiError = { message?: string | string[] };

function InviteMemberForm({ workspaceId }: InviteMemberFormProps) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") ?? "")
      .trim()
      .toLowerCase();
    const role = String(data.get("role") ?? "MEMBER");

    if (!email) {
      setFeedback("Enter the email address of an existing FinFlow account.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/members`, {
          body: JSON.stringify({ email, role }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });

        if (!response.ok) {
          setFeedback(await getErrorMessage(response));
          return;
        }

        form.reset();
        setFeedback("The member was added to this workspace.");
        router.refresh();
      } catch {
        setFeedback("We couldn't reach FinFlow. Please try again.");
      }
    });
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle as="h2">Add a workspace member</CardTitle>
        <p className="text-sm text-muted-foreground">
          The user must already have a FinFlow account. Email delivery will be added later.
        </p>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3 md:grid-cols-[1fr_12rem_auto]" onSubmit={handleSubmit}>
          <Input
            autoComplete="email"
            name="email"
            placeholder="accountant@example.com"
            required
            type="email"
          />
          <select
            className="h-9 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            defaultValue="MEMBER"
            name="role"
          >
            <option value="MEMBER">Member</option>
            <option value="ACCOUNTANT">Accountant</option>
            <option value="ADMIN">Admin</option>
          </select>
          <Button disabled={isPending} type="submit">
            {isPending ? "Adding…" : "Add member"}
          </Button>
        </form>
        {feedback ? (
          <p className="mt-3 text-sm text-muted-foreground" role="status">
            {feedback}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

async function getErrorMessage(response: Response): Promise<string> {
  const payload = (await response.json().catch(() => null)) as ApiError | null;
  return Array.isArray(payload?.message)
    ? payload.message.join(" ")
    : (payload?.message ?? "The member could not be added.");
}

export { InviteMemberForm };
