import { AuthForm } from "@/components/auth/auth-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a FinFlow account.",
};

export default function RegisterPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10 sm:px-6">
      <Card className="w-full max-w-md py-0">
        <CardHeader className="border-b px-6 py-6">
          <div className="mb-4 flex size-10 items-center justify-center rounded-control bg-primary text-sm font-bold text-primary-foreground">
            F
          </div>
          <CardTitle as="h1" className="text-xl font-semibold">
            Create your FinFlow account
          </CardTitle>
          <CardDescription>
            Start with a secure account for your financial workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 py-6">
          <AuthForm mode="register" />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link className="font-medium text-primary hover:underline" href="/login">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
