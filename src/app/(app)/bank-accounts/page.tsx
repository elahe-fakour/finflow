import { BankAccountsList } from "@/components/bank-accounts/bank-accounts-list";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { getBankAccounts } from "@/lib/bank-accounts/bank-accounts";
import { getActiveWorkspace } from "@/lib/workspaces/current-workspace";
import { FolderPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Bank Accounts",
  description: "Review bank, cash, and payment processor accounts in FinFlow.",
};

export default async function BankAccountsPage() {
  const workspace = await getActiveWorkspace();

  if (workspace === null) {
    return (
      <section aria-labelledby="bank-accounts-title">
        <PageHeader workspaceName={null} />
        <EmptyState
          action={
            <Button asChild>
              <Link href="/onboarding">Create workspace</Link>
            </Button>
          }
          className="mt-8"
          description="A workspace is required before bank accounts can be viewed."
          icon={FolderPlus}
          title="No workspace available"
        />
      </section>
    );
  }

  const accounts = await getBankAccounts(workspace.id);

  if (accounts === null) {
    return (
      <section aria-labelledby="bank-accounts-title">
        <PageHeader workspaceName={workspace.name} />
        <ErrorState
          className="mt-8"
          description="We couldn't load bank accounts for this workspace. Please try again shortly."
        />
      </section>
    );
  }

  return (
    <section aria-labelledby="bank-accounts-title">
      <PageHeader workspaceName={workspace.name} />
      <BankAccountsList accounts={accounts} />
    </section>
  );
}

function PageHeader({ workspaceName }: { workspaceName: string | null }) {
  return (
    <header className="space-y-2">
      <p className="text-sm font-medium text-primary">Cash management</p>
      <h1
        className="text-page-title font-semibold tracking-tight text-foreground sm:text-display"
        id="bank-accounts-title"
      >
        Bank Accounts
      </h1>
      <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
        Review the opening balances for bank, cash, and payment processor accounts.
        {workspaceName ? ` Workspace: ${workspaceName}.` : ""}
      </p>
    </header>
  );
}
