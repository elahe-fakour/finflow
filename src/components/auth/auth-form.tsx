"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

type AuthFormProps = {
  mode: "login" | "register";
  redirectTo?: string;
};

type AuthenticationError = {
  message?: string;
};

function AuthForm({ mode, redirectTo = "/" }: AuthFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isRegistration = mode === "register";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const displayName = String(formData.get("displayName") ?? "").trim();
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const body = isRegistration
      ? { ...(displayName === "" ? {} : { displayName }), email, password }
      : { email, password };

    startTransition(async () => {
      try {
        const response = await fetch(`/api/auth/${mode}`, {
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });

        if (!response.ok) {
          const error = (await response.json().catch(() => null)) as AuthenticationError | null;
          setErrorMessage(error?.message ?? "We couldn't complete that request. Please try again.");
          return;
        }

        router.replace(isRegistration ? "/login?registered=1" : redirectTo);
        router.refresh();
      } catch {
        setErrorMessage("We couldn't reach FinFlow. Please check your connection and try again.");
      }
    });
  }

  return (
    <form className="space-y-5" noValidate onSubmit={handleSubmit}>
      {isRegistration ? (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="display-name">
            Name <span className="text-muted-foreground">(optional)</span>
          </label>
          <Input autoComplete="name" id="display-name" maxLength={120} name="displayName" />
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="email">
          Email address
        </label>
        <Input autoComplete="email" id="email" name="email" required type="email" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="password">
          Password
        </label>
        <Input
          autoComplete={isRegistration ? "new-password" : "current-password"}
          id="password"
          maxLength={128}
          minLength={15}
          name="password"
          required
          type="password"
        />
        {isRegistration ? (
          <p className="text-xs leading-5 text-muted-foreground">
            Use a passphrase between 15 and 128 characters.
          </p>
        ) : null}
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
        {isPending ? "Please wait…" : isRegistration ? "Create account" : "Sign in"}
      </Button>
    </form>
  );
}

export { AuthForm };
