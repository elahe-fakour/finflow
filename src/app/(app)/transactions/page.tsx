import { BankTransactionList } from "@/components/bank-transactions/bank-transaction-list";
import { BankTransactionImportHistory } from "@/components/bank-transactions/bank-transaction-import-history";
import { CreateBankTransactionForm } from "@/components/bank-transactions/create-bank-transaction-form";
import { CsvImportPreview } from "@/components/bank-transactions/csv-import-preview";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { getBankAccounts } from "@/lib/bank-accounts/bank-accounts";
import {
  getBankTransactionImportHistory,
  getBankTransactions,
} from "@/lib/bank-transactions/bank-transactions";
import {
  createBankTransactionListPath,
  parseBankTransactionListFilters,
  type BankTransactionListSearchParams,
} from "@/lib/bank-transactions/bank-transaction-filters";
import { getActiveWorkspace } from "@/lib/workspaces/current-workspace";
import { FolderPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Transactions",
  description: "Search and filter bank transactions in FinFlow.",
};

type TransactionsPageProps = {
  searchParams: Promise<BankTransactionListSearchParams>;
};

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const workspace = await getActiveWorkspace();
  const filters = parseBankTransactionListFilters(await searchParams);

  if (workspace === null) {
    return (
      <section aria-labelledby="transactions-title">
        <PageHeader workspaceName={null} />
        <EmptyState
          action={
            <Button asChild>
              <Link href="/onboarding">Create workspace</Link>
            </Button>
          }
          className="mt-8"
          description="A workspace is required before bank transactions can be viewed."
          icon={FolderPlus}
          title="No workspace available"
        />
      </section>
    );
  }

  const [accounts, imports, transactions] = await Promise.all([
    getBankAccounts(workspace.id),
    getBankTransactionImportHistory(workspace.id),
    getBankTransactions(workspace.id, filters),
  ]);

  if (accounts === null || imports === null || transactions === null) {
    return (
      <section aria-labelledby="transactions-title">
        <PageHeader workspaceName={workspace.name} />
        <ErrorState
          className="mt-8"
          description="We couldn't load bank transaction activity for this workspace. Please try again shortly."
        />
      </section>
    );
  }

  if (transactions.totalPages > 0 && filters.page > transactions.totalPages) {
    redirect(createBankTransactionListPath(filters, transactions.totalPages));
  }

  const activeAccounts = accounts.filter((account) => account.status === "ACTIVE");

  return (
    <section aria-labelledby="transactions-title">
      <PageHeader workspaceName={workspace.name} />
      <div className="mt-8">
        {workspace.role === "MEMBER" ? null : activeAccounts.length === 0 ? (
          <EmptyState
            action={
              <Button asChild>
                <Link href="/bank-accounts">Add bank account</Link>
              </Button>
            }
            description="Create an active bank account before recording manual transaction activity."
            icon={FolderPlus}
            title="No active bank accounts"
          />
        ) : (
          <div className="space-y-6">
            <CreateBankTransactionForm accounts={activeAccounts} workspaceId={workspace.id} />
            <CsvImportPreview accounts={activeAccounts} workspaceId={workspace.id} />
          </div>
        )}
      </div>
      <div className="mt-6">
        <BankTransactionImportHistory imports={imports} />
      </div>
      <BankTransactionList accounts={accounts} filters={filters} transactions={transactions} />
    </section>
  );
}

function PageHeader({ workspaceName }: { workspaceName: string | null }) {
  return (
    <header className="space-y-2">
      <p className="text-sm font-medium text-primary">Cash movement</p>
      <h1
        className="text-page-title font-semibold tracking-tight text-foreground sm:text-display"
        id="transactions-title"
      >
        Transactions
      </h1>
      <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
        Search and review the money moving through your bank accounts.
        {workspaceName ? ` Workspace: ${workspaceName}.` : ""}
      </p>
    </header>
  );
}
