"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

type ApiError = {
  message?: string | string[];
};

function WorkspaceOnboardingForm() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();

    if (name.length === 0) {
      setErrorMessage("Enter a workspace name to continue.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/workspaces", {
          body: JSON.stringify({ name }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });

        if (!response.ok) {
          setErrorMessage(await getErrorMessage(response));
          return;
        }

        router.replace("/income-expenses");
        router.refresh();
      } catch {
        setErrorMessage("We couldn't reach FinFlow. Please check your connection and try again.");
      }
    });
  }

  return (
    <form className="space-y-5" noValidate onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="workspace-name">
          Business or workspace name
        </label>
        <Input
          autoComplete="organization"
          id="workspace-name"
          maxLength={120}
          name="name"
          placeholder="Acme Studio"
          required
        />
        <p className="text-xs leading-5 text-muted-foreground">
          This can be your company, client practice, or freelance business name.
        </p>
      </div>

      {errorMessage ? (
        <p
          className="rounded-control border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      <Button className="w-full" disabled={isPending} size="lg" type="submit">
        {isPending ? "Creating workspace…" : "Create workspace"}
      </Button>
    </form>
  );
}

async function getErrorMessage(response: Response): Promise<string> {
  const error = (await response.json().catch(() => null)) as ApiError | null;
  const message = error?.message;

  return Array.isArray(message)
    ? message.join(" ")
    : (message ?? "We couldn't create your workspace. Please try again.");
}

export { WorkspaceOnboardingForm };
