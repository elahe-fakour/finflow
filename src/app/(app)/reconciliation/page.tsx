import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { getBankTransactions } from "@/lib/bank-transactions/bank-transactions";
import { formatUsdMinorUnits } from "@/lib/money/format-minor-units";
import { getActiveWorkspace } from "@/lib/workspaces/current-workspace";
import { ArrowDownLeft, ArrowRight, FileSearch, FolderPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Reconciliation",
  description: "Review incoming bank transactions and suggested invoice matches in FinFlow.",
};

const PAGE_SIZE = 10;

export default async function ReconciliationPage() {
  const workspace = await getActiveWorkspace();

  if (workspace === null) {
    return (
      <section aria-labelledby="reconciliation-title">
        <PageHeader />
        <EmptyState
          action={
            <Button asChild>
              <Link href="/onboarding">Create workspace</Link>
            </Button>
          }
          className="mt-8"
          description="Create a workspace before reviewing bank transaction matches."
          icon={FolderPlus}
          title="No workspace available"
        />
      </section>
    );
  }

  const transactions = await getBankTransactions(workspace.id, {
    direction: "INFLOW",
    page: 1,
    pageSize: PAGE_SIZE,
  });

  if (transactions === null) {
    return (
      <section aria-labelledby="reconciliation-title">
        <PageHeader />
        <ErrorState
          className="mt-8"
          description="We couldn't load incoming bank transactions for this workspace. Please try again shortly."
        />
      </section>
    );
  }

  return (
    <section aria-labelledby="reconciliation-title">
      <PageHeader />

      <Card className="mt-8">
        <CardHeader>
          <CardTitle as="h2">Incoming transactions</CardTitle>
          <CardDescription>
            Choose a transaction to review explainable invoice suggestions. FinFlow only creates a
            payment after an authorized user confirms a match.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.data.length === 0 ? (
            <EmptyState
              action={
                <Button asChild variant="outline">
                  <Link href="/transactions">
                    View transactions
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              }
              description="Import or record incoming bank activity to review possible invoice matches."
              icon={FileSearch}
              title="No incoming transactions yet"
            />
          ) : (
            <>
              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="w-full min-w-[46rem] text-left text-sm">
                  <caption className="sr-only">Incoming bank transactions to review</caption>
                  <thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium" scope="col">
                        Transaction
                      </th>
                      <th className="px-4 py-3 font-medium" scope="col">
                        Date
                      </th>
                      <th className="px-4 py-3 font-medium" scope="col">
                        Bank account
                      </th>
                      <th className="px-4 py-3 text-right font-medium" scope="col">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-right font-medium" scope="col">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {transactions.data.map((transaction) => (
                      <tr className="hover:bg-muted/30" key={transaction.id}>
                        <td className="px-4 py-4">
                          <p className="font-semibold text-foreground">{transaction.description}</p>
                          {transaction.reference ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Reference: {transaction.reference}
                            </p>
                          ) : null}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                          {transaction.transactionDate}
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">
                          {transaction.bankAccount.name}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-right font-semibold tabular-nums text-success">
                          +{formatUsdMinorUnits(transaction.amountMinorUnits)}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/transactions/${transaction.id}`}>
                              Review match
                              <ArrowRight aria-hidden="true" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {transactions.data.length} of {transactions.totalItems} incoming
                  {transactions.totalItems === 1 ? " transaction" : " transactions"}.
                </p>
                <Button asChild variant="ghost">
                  <Link href="/transactions?direction=INFLOW">
                    View all incoming activity
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function PageHeader() {
  return (
    <header className="space-y-2">
      <p className="text-sm font-medium text-primary">Banking</p>
      <div className="flex flex-wrap items-center gap-3">
        <h1
          className="text-page-title font-semibold tracking-tight text-foreground sm:text-display"
          id="reconciliation-title"
        >
          Reconciliation
        </h1>
        <Badge variant="outline">
          <ArrowDownLeft aria-hidden="true" />
          Incoming payments
        </Badge>
      </div>
      <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
        Match bank deposits to invoices with clear evidence and an explicit confirmation step.
      </p>
    </header>
  );
}
