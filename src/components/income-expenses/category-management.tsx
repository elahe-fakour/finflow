"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type {
  IncomeExpenseCategory,
  IncomeExpenseCategoryType,
} from "@/lib/income-expenses/income-expense-categories";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState, useTransition } from "react";

type CategoryManagementProps = {
  canManage: boolean;
  initialCategories: IncomeExpenseCategory[];
  workspaceId: string;
};

type ErrorPayload = {
  message?: string | string[];
};

function CategoryManagement({
  canManage,
  initialCategories,
  workspaceId,
}: CategoryManagementProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [draftNames, setDraftNames] = useState<Record<IncomeExpenseCategoryType, string>>({
    EXPENSE: "",
    INCOME: "",
  });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const incomeCategories = categories.filter((category) => category.type === "INCOME");
  const expenseCategories = categories.filter((category) => category.type === "EXPENSE");

  function createCategory(type: IncomeExpenseCategoryType) {
    const name = draftNames[type].trim();

    if (name.length === 0) {
      setFeedback("Enter a category name before adding it.");
      return;
    }

    startTransition(async () => {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/income-expense-categories`,
        requestOptions("POST", { name, type }),
      );

      if (!response.ok) {
        setFeedback(await getResponseMessage(response));
        return;
      }

      const category = (await response.json()) as IncomeExpenseCategory;
      setCategories((currentCategories) =>
        [...currentCategories, category].sort(compareCategories),
      );
      setDraftNames((currentNames) => ({ ...currentNames, [type]: "" }));
      setFeedback(`${category.name} was added.`);
    });
  }

  function saveCategoryName(category: IncomeExpenseCategory) {
    const name = editingName.trim();

    if (name.length === 0) {
      setFeedback("A category name cannot be empty.");
      return;
    }

    startTransition(async () => {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/income-expense-categories/${category.id}`,
        requestOptions("PATCH", { name }),
      );

      if (!response.ok) {
        setFeedback(await getResponseMessage(response));
        return;
      }

      const updatedCategory = (await response.json()) as IncomeExpenseCategory;
      setCategories((currentCategories) =>
        currentCategories
          .map((currentCategory) =>
            currentCategory.id === updatedCategory.id ? updatedCategory : currentCategory,
          )
          .sort(compareCategories),
      );
      setEditingCategoryId(null);
      setEditingName("");
      setFeedback(`${updatedCategory.name} was updated.`);
    });
  }

  function deleteCategory(category: IncomeExpenseCategory) {
    if (!window.confirm(`Delete the ${category.name} category? This cannot be undone.`)) {
      return;
    }

    startTransition(async () => {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/income-expense-categories/${category.id}`,
        requestOptions("DELETE"),
      );

      if (!response.ok) {
        setFeedback(await getResponseMessage(response));
        return;
      }

      setCategories((currentCategories) =>
        currentCategories.filter((currentCategory) => currentCategory.id !== category.id),
      );
      setFeedback(`${category.name} was deleted.`);
    });
  }

  return (
    <div className="space-y-6">
      <p aria-live="polite" className="sr-only">
        {feedback}
      </p>
      {feedback ? (
        <p className="rounded-control border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
          {feedback}
        </p>
      ) : null}
      {!canManage ? (
        <p className="rounded-control border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
          Your role allows viewing categories, but not changing them.
        </p>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-2">
        <CategoryGroup
          canManage={canManage}
          categories={incomeCategories}
          draftName={draftNames.INCOME}
          editingCategoryId={editingCategoryId}
          editingName={editingName}
          isPending={isPending}
          onCreate={() => createCategory("INCOME")}
          onDraftNameChange={(name) => setDraftNames((current) => ({ ...current, INCOME: name }))}
          onEdit={(category) => {
            setEditingCategoryId(category.id);
            setEditingName(category.name);
          }}
          onEditingNameChange={setEditingName}
          onSave={saveCategoryName}
          onCancel={() => {
            setEditingCategoryId(null);
            setEditingName("");
          }}
          onDelete={deleteCategory}
          title="Income categories"
          description="Classify revenue consistently for reporting."
        />
        <CategoryGroup
          canManage={canManage}
          categories={expenseCategories}
          draftName={draftNames.EXPENSE}
          editingCategoryId={editingCategoryId}
          editingName={editingName}
          isPending={isPending}
          onCreate={() => createCategory("EXPENSE")}
          onDraftNameChange={(name) => setDraftNames((current) => ({ ...current, EXPENSE: name }))}
          onEdit={(category) => {
            setEditingCategoryId(category.id);
            setEditingName(category.name);
          }}
          onEditingNameChange={setEditingName}
          onSave={saveCategoryName}
          onCancel={() => {
            setEditingCategoryId(null);
            setEditingName("");
          }}
          onDelete={deleteCategory}
          title="Expense categories"
          description="Keep spending grouped for clear expense analysis."
        />
      </div>
    </div>
  );
}

type CategoryGroupProps = {
  canManage: boolean;
  categories: IncomeExpenseCategory[];
  description: string;
  draftName: string;
  editingCategoryId: string | null;
  editingName: string;
  isPending: boolean;
  onCancel: () => void;
  onCreate: () => void;
  onDelete: (category: IncomeExpenseCategory) => void;
  onDraftNameChange: (name: string) => void;
  onEdit: (category: IncomeExpenseCategory) => void;
  onEditingNameChange: (name: string) => void;
  onSave: (category: IncomeExpenseCategory) => void;
  title: string;
};

function CategoryGroup({
  canManage,
  categories,
  description,
  draftName,
  editingCategoryId,
  editingName,
  isPending,
  onCancel,
  onCreate,
  onDelete,
  onDraftNameChange,
  onEdit,
  onEditingNameChange,
  onSave,
  title,
}: CategoryGroupProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.length === 0 ? (
          <p className="rounded-control border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
            No categories yet.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-control border border-border">
            {categories.map((category) => {
              const isEditing = editingCategoryId === category.id;

              return (
                <li className="flex min-h-12 items-center gap-2 px-3 py-2" key={category.id}>
                  {isEditing ? (
                    <Input
                      aria-label={`Rename ${category.name}`}
                      autoFocus
                      disabled={isPending}
                      onChange={(event) => onEditingNameChange(event.target.value)}
                      value={editingName}
                    />
                  ) : (
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {category.name}
                    </span>
                  )}
                  {isEditing ? (
                    <div className="flex shrink-0 gap-1">
                      <Button
                        aria-label={`Save ${category.name}`}
                        disabled={isPending}
                        onClick={() => onSave(category)}
                        size="icon-sm"
                        type="button"
                      >
                        <Check />
                      </Button>
                      <Button
                        aria-label={`Cancel editing ${category.name}`}
                        disabled={isPending}
                        onClick={onCancel}
                        size="icon-sm"
                        type="button"
                        variant="outline"
                      >
                        <X />
                      </Button>
                    </div>
                  ) : canManage ? (
                    <div className="flex shrink-0 gap-1">
                      <Button
                        aria-label={`Rename ${category.name}`}
                        disabled={isPending}
                        onClick={() => onEdit(category)}
                        size="icon-sm"
                        type="button"
                        variant="ghost"
                      >
                        <Pencil />
                      </Button>
                      <Button
                        aria-label={`Delete ${category.name}`}
                        disabled={isPending}
                        onClick={() => onDelete(category)}
                        size="icon-sm"
                        type="button"
                        variant="ghost"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
        {canManage ? (
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              onCreate();
            }}
          >
            <Input
              disabled={isPending}
              onChange={(event) => onDraftNameChange(event.target.value)}
              placeholder="New category name"
              value={draftName}
            />
            <Button disabled={isPending} type="submit">
              <Plus />
              Add
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}

function compareCategories(left: IncomeExpenseCategory, right: IncomeExpenseCategory): number {
  return left.type.localeCompare(right.type) || left.name.localeCompare(right.name);
}

function requestOptions(method: "DELETE" | "PATCH" | "POST", body?: object): RequestInit {
  return {
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    method,
  };
}

async function getResponseMessage(response: Response): Promise<string> {
  const payload = (await response.json().catch(() => null)) as ErrorPayload | null;
  const message = payload?.message;

  return Array.isArray(message)
    ? message.join(" ")
    : (message ?? "We couldn't save that category. Please try again.");
}

export { CategoryManagement };
