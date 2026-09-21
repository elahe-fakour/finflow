import { Button } from "@/components/ui/button";
import { NotFoundState } from "@/components/ui/not-found-state";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The requested FinFlow page could not be found.",
};

export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <div className="w-full max-w-xl">
        <NotFoundState
          action={
            <Button asChild size="lg">
              <Link href="/">Go to dashboard</Link>
            </Button>
          }
        />
      </div>
    </main>
  );
}
