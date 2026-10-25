import { AcceptInvitationForm } from "@/components/workspaces/accept-invitation-form";
import { requireCurrentUser } from "@/lib/auth/current-user";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accept workspace invitation",
  description: "Join a FinFlow workspace.",
};

type InvitationPageProps = { params: Promise<{ token: string }> };

export default async function InvitationPage({ params }: InvitationPageProps) {
  await requireCurrentUser();
  const { token } = await params;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <section className="w-full max-w-lg space-y-5 rounded-xl bg-card p-8 text-center ring-1 ring-foreground/10">
        <p className="text-sm font-medium text-primary">FinFlow workspace</p>
        <h1 className="text-2xl font-semibold text-foreground">You have been invited</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Accept this invitation to join the workspace with the assigned role.
        </p>
        <AcceptInvitationForm token={token} />
      </section>
    </main>
  );
}
