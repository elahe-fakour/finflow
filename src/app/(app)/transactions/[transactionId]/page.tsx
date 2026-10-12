import { TransactionCategoryAssignment } from "@/components/bank-transactions/transaction-category-assignment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { getBankTransaction } from "@/lib/bank-transactions/bank-transactions";
import { getIncomeExpenseCategories } from "@/lib/income-expenses/income-expense-categories";
import { formatUsdMinorUnits } from "@/lib/money/format-minor-units";
import { getActiveWorkspace } from "@/lib/workspaces/current-workspace";
import { ArrowDownLeft, ArrowUpRight, FolderPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Transaction details",
  description: "View a bank transaction and manage its financial category.",
};

type TransactionDetailPageProps = {
  params: Promise<{ transactionId: string }>;
};

export default async function TransactionDetailPage({ params }: TransactionDetailPageProps) {
  const { transactionId } = await params;
  const workspace = await getActiveWorkspace();

  if (workspace === null) {
    return (
      <section aria-labelledby="transaction-title">
        <EmptyState
          action={
            <Button asChild>
              <Link href="/onboarding">Create workspace</Link>
            </Button>
          }
          description="A workspace is required before bank transactions can be viewed."
          icon={FolderPlus}
          title="No workspace available"
        />
      </section>
    );
  }

  const [transaction, categories] = await Promise.all([
    getBankTransaction(workspace.id, transactionId),
    getIncomeExpenseCategories(workspace.id),
  ]);

  if (transaction === null) {
    notFound();
  }

  if (categories === null) {
    return (
      <section aria-labelledby="transaction-title">
        <PageHeader description={transaction.description} />
        <ErrorState
          className="mt-8"
          description="We couldn't load categories for this workspace. Please try again shortly."
        />
      </section>
    );
  }

  const isInflow = BigInt(transaction.amountMinorUnits) > 0n;
  const transactionType = isInflow ? "INCOME" : "EXPENSE";

  return (
    <section aria-labelledby="transaction-title">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <Link
          className="underline-offset-4 hover:text-foreground hover:underline"
          href="/transactions"
        >
          Transactions
        </Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{transaction.description}</span>
      </nav>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader description={transaction.description} />
        <Badge variant={isInflow ? "default" : "secondary"}>
          {isInflow ? <ArrowDownLeft aria-hidden="true" /> : <ArrowUpRight aria-hidden="true" />}
          {isInflow ? "Inflow" : "Outflow"}
        </Badge>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle as="h2">Transaction details</CardTitle>
            <CardDescription>
              Original bank activity as recorded for this workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4 text-sm">
              <DetailRow label="Amount">
                <span
                  className={
                    isInflow ? "font-semibold text-success" : "font-semibold text-foreground"
                  }
                >
                  {isInflow ? "+" : ""}
                  {formatUsdMinorUnits(transaction.amountMinorUnits)}
                </span>
              </DetailRow>
              <DetailRow label="Date">{transaction.transactionDate}</DetailRow>
              <DetailRow label="Bank account">{transaction.bankAccount.name}</DetailRow>
              <DetailRow label="Reference">{transaction.reference ?? "No reference"}</DetailRow>
              <DetailRow label="Current category">
                {transaction.category?.name ?? "Uncategorized"}
              </DetailRow>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2">Financial category</CardTitle>
            <CardDescription>Classify this transaction for consistent reporting.</CardDescription>
          </CardHeader>
          <CardContent>
            <TransactionCategoryAssignment
              canManage={workspace.role !== "MEMBER"}
              categories={categories}
              categoryId={transaction.category?.id ?? null}
              transactionId={transaction.id}
              transactionType={transactionType}
              workspaceId={workspace.id}
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function DetailRow({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border pb-4 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{children}</dd>
    </div>
  );
}

function PageHeader({ description }: { description: string }) {
  return (
    <header className="space-y-2">
      <p className="text-sm font-medium text-primary">Cash movement</p>
      <h1
        className="text-page-title font-semibold tracking-tight text-foreground sm:text-display"
        id="transaction-title"
      >
        {description}
      </h1>
      <p className="text-sm leading-6 text-muted-foreground sm:text-base">
        Review bank activity and assign its reporting category.
      </p>
    </header>
  );
}
