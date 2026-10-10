import { CategoryManagement } from "@/components/income-expenses/category-management";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { getIncomeExpenseCategories } from "@/lib/income-expenses/income-expense-categories";
import { getActiveWorkspace } from "@/lib/workspaces/current-workspace";
import { FolderPlus } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Income & Expenses",
  description: "Manage income and expense categories in FinFlow.",
};

export default async function IncomeExpensesPage() {
  const workspace = await getActiveWorkspace();

  if (workspace === null) {
    return (
      <section aria-labelledby="income-expenses-title">
        <PageHeader workspaceName={null} />
        <EmptyState
          className="mt-8"
          description="A workspace is required before financial categories can be managed."
          icon={FolderPlus}
          title="No workspace available"
        />
      </section>
    );
  }

  const categories = await getIncomeExpenseCategories(workspace.id);

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
