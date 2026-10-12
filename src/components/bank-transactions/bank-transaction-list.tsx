import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { BankAccount } from "@/lib/bank-accounts/bank-accounts";
import type {
  BankTransaction,
  PaginatedBankTransactions,
} from "@/lib/bank-transactions/bank-transactions";
import {
  createBankTransactionListPath,
  type BankTransactionListFilters,
} from "@/lib/bank-transactions/bank-transaction-filters";
import { formatUsdMinorUnits } from "@/lib/money/format-minor-units";
import { ArrowDownLeft, ArrowLeft, ArrowRight, ArrowUpRight, FileSearch } from "lucide-react";
import Link from "next/link";

type BankTransactionListProps = {
  accounts: BankAccount[];
  filters: BankTransactionListFilters;
  transactions: PaginatedBankTransactions;
};

function BankTransactionList({ accounts, filters, transactions }: BankTransactionListProps) {
  return (
    <section aria-labelledby="bank-transactions-list-title" className="mt-8 space-y-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            className="text-xl font-semibold tracking-tight text-foreground"
            id="bank-transactions-list-title"
          >
            Bank activity
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Review money moving through accounts in this workspace.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {transactions.totalItems === 1
            ? "1 transaction"
            : `${transactions.totalItems} transactions`}
        </p>
      </header>

      <TransactionFilters accounts={accounts} filters={filters} />

      {transactions.data.length === 0 ? (
        <EmptyState
          description={
            transactions.totalItems === 0
              ? "No bank transactions have been recorded for this workspace yet."
              : "Try changing or clearing the filters to see more transactions."
          }
          icon={FileSearch}
          title={
            transactions.totalItems === 0 ? "No bank transactions yet" : "No matching transactions"
          }
        />
      ) : (
        <TransactionTable transactions={transactions.data} />
      )}

      <Pagination filters={filters} transactions={transactions} />
    </section>
  );
}

function TransactionFilters({
  accounts,
  filters,
}: {
  accounts: BankAccount[];
  filters: BankTransactionListFilters;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle as="h3">Filters</CardTitle>
        <CardDescription>
          Search descriptions and references, or narrow results by account, direction, and date.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action="/transactions" className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <FilterField id="transaction-search" label="Search">
            <input
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              defaultValue={filters.q ?? ""}
              id="transaction-search"
              maxLength={100}
              name="q"
              placeholder="Description or reference"
              type="search"
            />
          </FilterField>
          <FilterField id="transaction-account" label="Bank account">
            <select
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              defaultValue={filters.bankAccountId ?? ""}
              id="transaction-account"
              name="bankAccountId"
            >
              <option value="">All accounts</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                  {account.status === "ARCHIVED" ? " (Archived)" : ""}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField id="transaction-direction" label="Direction">
            <select
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              defaultValue={filters.direction ?? ""}
              id="transaction-direction"
              name="direction"
            >
              <option value="">All directions</option>
              <option value="INFLOW">Inflow</option>
              <option value="OUTFLOW">Outflow</option>
            </select>
          </FilterField>
          <FilterField id="transaction-from" label="From">
            <input
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              defaultValue={filters.from ?? ""}
              id="transaction-from"
              name="from"
              type="date"
            />
          </FilterField>
          <FilterField id="transaction-to" label="To">
            <input
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              defaultValue={filters.to ?? ""}
              id="transaction-to"
              name="to"
              type="date"
            />
          </FilterField>
          <div className="flex items-end gap-2">
            <Button className="flex-1" type="submit">
              Apply filters
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href="/transactions">Clear</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function FilterField({
  children,
  id,
  label,
}: {
  children: React.ReactNode;
  id: string;
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  );
}

function TransactionTable({ transactions }: { transactions: BankTransaction[] }) {
  return (
    <div className="overflow-x-auto rounded-card border border-border bg-card">
      <table className="w-full min-w-[46rem] text-left text-sm">
        <thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium" scope="col">
              Date
            </th>
            <th className="px-4 py-3 font-medium" scope="col">
              Description
            </th>
            <th className="px-4 py-3 font-medium" scope="col">
              Account
            </th>
            <th className="px-4 py-3 font-medium" scope="col">
              Direction
            </th>
            <th className="px-4 py-3 text-right font-medium" scope="col">
              Amount
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {transactions.map((transaction) => {
            const isInflow = BigInt(transaction.amountMinorUnits) > 0n;

            return (
              <tr className="hover:bg-muted/30" key={transaction.id}>
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                  {transaction.transactionDate}
                </td>
                <td className="max-w-80 px-4 py-3">
                  <p className="truncate font-medium text-foreground">{transaction.description}</p>
                  {transaction.reference ? (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {transaction.reference}
                    </p>
                  ) : null}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                  {transaction.bankAccount.name}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={isInflow ? "default" : "secondary"}>
                    {isInflow ? (
                      <ArrowDownLeft aria-hidden="true" />
                    ) : (
                      <ArrowUpRight aria-hidden="true" />
                    )}
                    {isInflow ? "Inflow" : "Outflow"}
                  </Badge>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums">
                  <span className={isInflow ? "text-success" : "text-foreground"}>
                    {isInflow ? "+" : ""}
                    {formatUsdMinorUnits(transaction.amountMinorUnits)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Pagination({
  filters,
  transactions,
}: {
  filters: BankTransactionListFilters;
  transactions: PaginatedBankTransactions;
}) {
  if (transactions.totalPages <= 1) {
    return null;
  }

  return (
    <nav aria-label="Transaction pagination" className="flex items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">
        Page {transactions.page} of {transactions.totalPages}
      </p>
      <div className="flex gap-2">
        {transactions.page <= 1 ? (
          <Button disabled variant="outline">
            <ArrowLeft />
            Previous
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link href={createBankTransactionListPath(filters, transactions.page - 1)}>
              <ArrowLeft />
              Previous
            </Link>
          </Button>
        )}
        {transactions.page >= transactions.totalPages ? (
          <Button disabled variant="outline">
            Next
            <ArrowRight />
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link href={createBankTransactionListPath(filters, transactions.page + 1)}>
              Next
              <ArrowRight />
            </Link>
          </Button>
        )}
      </div>
    </nav>
  );
}

export { BankTransactionList };
