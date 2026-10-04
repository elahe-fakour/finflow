import { AuthForm } from "@/components/auth/auth-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSafeRedirectPath } from "@/lib/auth/redirects";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your FinFlow workspace.",
};

type LoginPageProps = {
  searchParams: Promise<{
    next?: string | string[];
    reason?: string | string[];
    registered?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, reason, registered } = await searchParams;
  const redirectTo = getSafeRedirectPath(next);
  const sessionExpired = reason === "session-expired";
  const accountCreated = registered === "1";

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10 sm:px-6">
      <Card className="w-full max-w-md py-0">
        <CardHeader className="border-b px-6 py-6">
          <div className="mb-4 flex size-10 items-center justify-center rounded-control bg-primary text-sm font-bold text-primary-foreground">
            F
          </div>
          <CardTitle as="h1" className="text-xl font-semibold">
            Welcome to FinFlow
          </CardTitle>
          <CardDescription>Sign in to manage your financial operations.</CardDescription>
        </CardHeader>
        <CardContent className="px-6 py-6">
          {sessionExpired ? (
            <p className="mb-5 rounded-control border border-warning/25 bg-warning/10 px-3 py-2 text-sm text-warning">
              Your session has ended. Please sign in again.
            </p>
          ) : null}
          {accountCreated ? (
            <p className="mb-5 rounded-control border border-success/25 bg-success/10 px-3 py-2 text-sm text-success">
              Your account is ready. Sign in to continue.
            </p>
          ) : null}
          <AuthForm mode="login" redirectTo={redirectTo} />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to FinFlow?{" "}
            <Link className="font-medium text-primary hover:underline" href="/register">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
