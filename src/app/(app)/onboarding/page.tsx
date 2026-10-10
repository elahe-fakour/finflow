import { WorkspaceOnboardingForm } from "@/components/workspaces/workspace-onboarding-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveWorkspace } from "@/lib/workspaces/current-workspace";
import { Building2 } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Create workspace",
  description: "Create your first FinFlow workspace.",
};

export default async function WorkspaceOnboardingPage() {
  const workspace = await getActiveWorkspace();

  if (workspace !== null) {
    redirect("/income-expenses");
  }

  return (
    <section
      className="mx-auto flex min-h-[calc(100svh-12rem)] max-w-xl items-center"
      aria-labelledby="onboarding-title"
    >
      <Card className="w-full py-0">
        <CardHeader className="border-b px-6 py-6">
          <div className="mb-4 flex size-10 items-center justify-center rounded-control bg-primary text-primary-foreground">
            <Building2 aria-hidden="true" className="size-5" />
          </div>
          <CardTitle as="h1" className="text-xl font-semibold" id="onboarding-title">
            Create your workspace
          </CardTitle>
          <CardDescription>
            Set up the business where you will manage financial operations.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 py-6">
          <WorkspaceOnboardingForm />
        </CardContent>
      </Card>
    </section>
  );
}
