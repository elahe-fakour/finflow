"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

function LogoutButton() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleLogout() {
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/logout", { method: "POST" });

        if (!response.ok) {
          setErrorMessage("Sign out could not be completed. Please try again.");
          return;
        }

        router.replace("/login");
        router.refresh();
      } catch {
        setErrorMessage("Sign out could not be completed. Please try again.");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        aria-label="Sign out"
        disabled={isPending}
        onClick={handleLogout}
        size="sm"
        type="button"
        variant="ghost"
      >
        <LogOut aria-hidden="true" />
        <span className="hidden lg:inline">{isPending ? "Signing out…" : "Sign out"}</span>
      </Button>
      {errorMessage ? (
        <span className="sr-only" role="alert">
          {errorMessage}
        </span>
      ) : null}
    </div>
  );
}

export { LogoutButton };
