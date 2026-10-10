import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type {
  IncomeExpenseCategory,
  IncomeExpenseEntry,
  PaginatedIncomeExpenseEntries,
} from "@/lib/income-expenses/income-expense-categories";
import {
  createEntryListPath,
  type EntryListFilters,
} from "@/lib/income-expenses/entry-list-filters";
import { formatUsdMinorUnits } from "@/lib/money/format-minor-units";
import { ArrowLeft, ArrowRight, FileSearch } from "lucide-react";
import Link from "next/link";

type IncomeExpenseEntryListProps = {
  categories: IncomeExpenseCategory[];
  entries: PaginatedIncomeExpenseEntries;
  filters: EntryListFilters;
};

function IncomeExpenseEntryList({ categories, entries, filters }: IncomeExpenseEntryListProps) {
  return (
    <section aria-labelledby="entries-title" className="space-y-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground" id="entries-title">
            Income & expense activity
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Review financial entries recorded for this workspace.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {entries.totalItems === 1 ? "1 entry" : `${entries.totalItems} entries`}
        </p>
      </header>

      <EntryFilters categories={categories} filters={filters} />

      {entries.data.length === 0 ? (
        <EmptyState
          description="Adjust the filters or record an income or expense entry when that workflow is available."
          icon={FileSearch}
          title="No matching entries"
        />
      ) : (
        <EntryTable entries={entries.data} />
      )}

      <Pagination entries={entries} filters={filters} />
    </section>
  );
}

function EntryFilters({
  categories,
  filters,
}: {
  categories: IncomeExpenseCategory[];
  filters: EntryListFilters;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle as="h3">Filters</CardTitle>
        <CardDescription>Use filters to narrow the activity list.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action="/income-expenses" className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <FilterField id="entry-type" label="Type">
            <select
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              defaultValue={filters.type ?? ""}
              id="entry-type"
              name="type"
            >
              <option value="">All types</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
            </select>
          </FilterField>
          <FilterField id="entry-category" label="Category">
            <select
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              defaultValue={filters.categoryId ?? ""}
              id="entry-category"
              name="categoryId"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({toDisplayType(category.type)})
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField id="entry-from" label="From">
            <input
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              defaultValue={filters.from ?? ""}
              id="entry-from"
              name="from"
              type="date"
            />
          </FilterField>
          <FilterField id="entry-to" label="To">
            <input
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              defaultValue={filters.to ?? ""}
              id="entry-to"
              name="to"
              type="date"
            />
          </FilterField>
          <div className="flex items-end gap-2">
            <Button className="flex-1" type="submit">
              Apply filters
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href="/income-expenses">Clear</Link>
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

function EntryTable({ entries }: { entries: IncomeExpenseEntry[] }) {
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
              Category
            </th>
            <th className="px-4 py-3 font-medium" scope="col">
              Counterparty
            </th>
            <th className="px-4 py-3 text-right font-medium" scope="col">
              Amount
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {entries.map((entry) => (
            <tr className="hover:bg-muted/30" key={entry.id}>
              <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                {entry.occurredOn}
              </td>
              <td className="max-w-72 px-4 py-3">
                <p className="truncate font-medium text-foreground">{entry.description}</p>
                {entry.reference ? (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{entry.reference}</p>
                ) : null}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Badge variant={entry.type === "INCOME" ? "default" : "secondary"}>
                    {toDisplayType(entry.type)}
                  </Badge>
                  <span className="whitespace-nowrap text-muted-foreground">
                    {entry.category.name}
                  </span>
                </div>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                {entry.vendor?.name ?? "—"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums">
                <span className={entry.type === "INCOME" ? "text-success" : "text-foreground"}>
                  {entry.type === "INCOME" ? "+" : "−"}
                  {formatUsdMinorUnits(entry.amountMinorUnits)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Pagination({
  entries,
  filters,
}: {
  entries: PaginatedIncomeExpenseEntries;
  filters: EntryListFilters;
}) {
  if (entries.totalPages <= 1) {
    return null;
  }

  return (
    <nav aria-label="Entry pagination" className="flex items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">
        Page {entries.page} of {entries.totalPages}
      </p>
      <div className="flex gap-2">
        {entries.page <= 1 ? (
          <Button disabled variant="outline">
            <ArrowLeft />
            Previous
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link href={createEntryListPath(filters, entries.page - 1)}>
              <ArrowLeft />
              Previous
            </Link>
          </Button>
        )}
        {entries.page >= entries.totalPages ? (
          <Button disabled variant="outline">
            Next
            <ArrowRight />
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link href={createEntryListPath(filters, entries.page + 1)}>
              Next
              <ArrowRight />
            </Link>
          </Button>
        )}
      </div>
    </nav>
  );
}

function toDisplayType(type: "EXPENSE" | "INCOME"): "Expense" | "Income" {
  return type === "INCOME" ? "Income" : "Expense";
}

export { IncomeExpenseEntryList };
