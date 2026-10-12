"use client";

import { Button } from "@/components/ui/button";
import type { IncomeExpenseCategory } from "@/lib/income-expenses/income-expense-categories";
import { CheckCircle2, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

type TransactionCategoryAssignmentProps = {
  canManage: boolean;
  categories: IncomeExpenseCategory[];
  categoryId: string | null;
  transactionId: string;
  transactionType: "EXPENSE" | "INCOME";
  workspaceId: string;
};

function TransactionCategoryAssignment({
  canManage,
  categories,
  categoryId,
  transactionId,
  transactionType,
  workspaceId,
}: TransactionCategoryAssignmentProps) {
  const router = useRouter();
  const [selectedCategoryId, setSelectedCategoryId] = useState(categoryId ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const matchingCategories = categories.filter((category) => category.type === transactionType);

  async function saveCategory() {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/bank-transactions/${transactionId}/category`,
        {
          body: JSON.stringify({
            categoryId: selectedCategoryId === "" ? null : selectedCategoryId,
          }),
          headers: { "Content-Type": "application/json" },
          method: "PATCH",
        },
      );

      if (!response.ok) {
        setMessage({ kind: "error", text: await getErrorMessage(response) });
        return;
      }

      setMessage({ kind: "success", text: "Category assignment saved." });
      router.refresh();
    } catch {
      setMessage({ kind: "error", text: "We couldn't save the category. Please try again." });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {transactionType === "INCOME"
          ? "Choose an income category for this inflow."
          : "Choose an expense category for this outflow."}
      </p>
      {matchingCategories.length === 0 ? (
        <p className="rounded-control border border-dashed border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          No matching categories exist yet. Create a {transactionType.toLowerCase()} category in
          Income & Expenses first.
        </p>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label
            className="flex-1 space-y-1.5 text-sm font-medium text-foreground"
            htmlFor="transaction-category"
          >
            Category
            <select
              className="mt-1 block h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              disabled={!canManage || isSaving}
              id="transaction-category"
              onChange={(event) => setSelectedCategoryId(event.target.value)}
              value={selectedCategoryId}
            >
              <option value="">Uncategorized</option>
              {matchingCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          {canManage ? (
            <Button
              disabled={isSaving || selectedCategoryId === (categoryId ?? "")}
              onClick={saveCategory}
              type="button"
            >
              {isSaving ? "Saving…" : "Save category"}
            </Button>
          ) : null}
        </div>
      )}
      {!canManage ? (
        <p className="text-sm text-muted-foreground">
          Your role can view categories but cannot change this assignment.
        </p>
      ) : null}
      {message ? (
        <p
          aria-live="polite"
          className={
            message.kind === "success"
              ? "flex items-center gap-2 text-sm text-success"
              : "flex items-center gap-2 text-sm text-destructive"
          }
          role={message.kind === "error" ? "alert" : "status"}
        >
          {message.kind === "success" ? (
            <CheckCircle2 aria-hidden="true" className="size-4" />
          ) : (
            <TriangleAlert aria-hidden="true" className="size-4" />
          )}
          {message.text}
        </p>
      ) : null}
    </div>
  );
}

async function getErrorMessage(response: Response): Promise<string> {
  const payload: unknown = await response.json().catch(() => null);

  if (typeof payload === "object" && payload !== null && "message" in payload) {
    const message = payload.message;

    if (typeof message === "string") {
      return message;
    }
  }

  return "We couldn't save the category. Please try again.";
}

export { TransactionCategoryAssignment };
