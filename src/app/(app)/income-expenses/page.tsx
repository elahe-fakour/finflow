import { CategoryManagement } from "@/components/income-expenses/category-management";
import { ExpenseEntryForm } from "@/components/income-expenses/expense-entry-form";
import { IncomeEntryForm } from "@/components/income-expenses/income-entry-form";
import { IncomeExpenseEntryList } from "@/components/income-expenses/income-expense-entry-list";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getIncomeExpenseCategories,
  getIncomeExpenseEntries,
  getVendorOptions,
} from "@/lib/income-expenses/income-expense-categories";
import {
  createEntryListPath,
  parseEntryListFilters,
  type EntryListSearchParams,
} from "@/lib/income-expenses/entry-list-filters";
import { getActiveWorkspace } from "@/lib/workspaces/current-workspace";
import { FolderPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Income & Expenses",
  description: "Manage income and expense categories in FinFlow.",
};

type IncomeExpensesPageProps = {
  searchParams: Promise<EntryListSearchParams>;
};

export default async function IncomeExpensesPage({ searchParams }: IncomeExpensesPageProps) {
  const workspace = await getActiveWorkspace();
  const filters = parseEntryListFilters(await searchParams);

  if (workspace === null) {
    return (
      <section aria-labelledby="income-expenses-title">
        <PageHeader workspaceName={null} />
        <EmptyState
          action={
            <Button asChild>
              <Link href="/onboarding">Create workspace</Link>
            </Button>
          }
          className="mt-8"
          description="A workspace is required before financial categories can be managed."
          icon={FolderPlus}
          title="No workspace available"
        />
      </section>
    );
  }

  const [categories, entries, vendors] = await Promise.all([
    getIncomeExpenseCategories(workspace.id),
    getIncomeExpenseEntries(workspace.id, filters),
    getVendorOptions(workspace.id),
  ]);

  if (categories === null) {
    return (
      <section aria-labelledby="income-expenses-title">
        <PageHeader workspaceName={workspace.name} />
        <ErrorState
          className="mt-8"
          description="We couldn't load category data for this workspace. Please try again shortly."
        />
      </section>
    );
  }

  if (entries === null) {
    return (
      <section aria-labelledby="income-expenses-title">
        <PageHeader workspaceName={workspace.name} />
        <div className="mt-8">
          <CategoryManagement
            canManage={workspace.role !== "MEMBER"}
            initialCategories={categories}
            workspaceId={workspace.id}
          />
        </div>
        <ErrorState
          className="mt-10"
          description="We couldn't load income and expense activity for this workspace. Please try again shortly."
        />
      </section>
    );
  }

  if (entries.totalPages > 0 && filters.page > entries.totalPages) {
    redirect(createEntryListPath(filters, entries.totalPages));
  }

  return (
    <section aria-labelledby="income-expenses-title">
      <PageHeader workspaceName={workspace.name} />
      <div className="mt-8">
        <CategoryManagement
          canManage={workspace.role !== "MEMBER"}
          initialCategories={categories}
          workspaceId={workspace.id}
        />
      </div>
      <div className="mt-10">
        <IncomeEntryForm
          canManage={workspace.role !== "MEMBER"}
          categories={categories}
          initialOccurredOn={new Date().toISOString().slice(0, 10)}
          key={categories.map((category) => category.id).join("-")}
          workspaceId={workspace.id}
        />
      </div>
      <div className="mt-10">
        {vendors === null ? (
          <ErrorState description="We couldn't load vendor options for this workspace. Please try again shortly." />
        ) : (
          <ExpenseEntryForm
            canManage={workspace.role !== "MEMBER"}
            categories={categories}
            initialOccurredOn={new Date().toISOString().slice(0, 10)}
            key={`${categories.map((category) => category.id).join("-")}-${vendors.map((vendor) => vendor.id).join("-")}`}
            vendors={vendors}
            workspaceId={workspace.id}
          />
        )}
      </div>
      <div className="mt-10">
        <IncomeExpenseEntryList categories={categories} entries={entries} filters={filters} />
      </div>
    </section>
  );
}

function PageHeader({ workspaceName }: { workspaceName: string | null }) {
  return (
    <header className="space-y-2">
      <p className="text-sm font-medium text-primary">Financial classification</p>
      <h1
        className="text-page-title font-semibold tracking-tight text-foreground sm:text-display"
        id="income-expenses-title"
      >
        Income & Expenses
      </h1>
      <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
        Manage the categories used to keep income and spending consistent.
        {workspaceName ? ` Workspace: ${workspaceName}.` : ""}
      </p>
    </header>
  );
}
