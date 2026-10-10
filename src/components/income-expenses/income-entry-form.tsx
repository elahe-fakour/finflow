"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { IncomeExpenseCategory } from "@/lib/income-expenses/income-expense-categories";
import { parseUsdToMinorUnits } from "@/lib/money/parse-usd-minor-units";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleDollarSign } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";

type IncomeEntryFormProps = {
  canManage: boolean;
  categories: IncomeExpenseCategory[];
  initialOccurredOn: string;
  workspaceId: string;
};

type IncomeEntryFormValues = {
  amount: string;
  categoryId: string;
  description: string;
  occurredOn: string;
  reference: string;
};

type ApiError = {
  message?: string | string[];
};

function IncomeEntryForm({
  canManage,
  categories,
  initialOccurredOn,
  workspaceId,
}: IncomeEntryFormProps) {
  const [requestError, setRequestError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const incomeCategories = useMemo(
    () => categories.filter((category) => category.type === "INCOME"),
    [categories],
  );
  const incomeEntrySchema = useMemo(
    () => createIncomeEntrySchema(incomeCategories.map((category) => category.id)),
    [incomeCategories],
  );
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<IncomeEntryFormValues>({
    defaultValues: {
      amount: "",
      categoryId: incomeCategories[0]?.id ?? "",
      description: "",
      occurredOn: initialOccurredOn,
      reference: "",
    },
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(incomeEntrySchema),
  });

  const onSubmit: SubmitHandler<IncomeEntryFormValues> = async (values) => {
    setRequestError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/income-expense-entries`, {
        body: JSON.stringify({
          amountMinorUnits: parseUsdToMinorUnits(values.amount),
          categoryId: values.categoryId,
          currency: "USD",
          description: values.description.trim(),
          occurredOn: values.occurredOn,
          ...(values.reference.trim() === "" ? {} : { reference: values.reference.trim() }),
          type: "INCOME",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        setRequestError(await getErrorMessage(response));
        return;
      }

      reset({
        amount: "",
        categoryId: incomeCategories[0]?.id ?? "",
        description: "",
        occurredOn: initialOccurredOn,
        reference: "",
      });
      setSuccessMessage("Income entry recorded.");
      router.refresh();
    } catch (error) {
      setRequestError(
        error instanceof Error
          ? error.message
          : "We couldn't record the income entry. Please try again.",
      );
    }
  };

  if (!canManage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle as="h2">Record income</CardTitle>
          <CardDescription>
            Your workspace role allows viewing entries, but not recording them.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (incomeCategories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle as="h2">Record income</CardTitle>
          <CardDescription>
            Add an income category above before recording an income entry.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-control bg-success/10 text-success">
            <CircleDollarSign aria-hidden="true" className="size-5" />
          </div>
          <div>
            <CardTitle as="h2">Record income</CardTitle>
            <CardDescription className="mt-1">
              Record a completed income event in USD for this workspace.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" noValidate onSubmit={handleSubmit(onSubmit)}>
          {requestError ? (
            <p
              className="rounded-control border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger"
              role="alert"
            >
              {requestError}
            </p>
          ) : null}
          {successMessage ? (
            <p
              className="rounded-control border border-success/25 bg-success/10 px-3 py-2 text-sm text-success"
              role="status"
            >
              {successMessage}
            </p>
          ) : null}
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Amount (USD)" error={errors.amount?.message} htmlFor="income-amount">
              <Input
                aria-invalid={Boolean(errors.amount)}
                autoComplete="off"
                id="income-amount"
                inputMode="decimal"
                placeholder="1250.00"
                {...register("amount")}
              />
            </Field>
            <Field
              label="Income category"
              error={errors.categoryId?.message}
              htmlFor="income-category"
            >
              <select
                aria-invalid={Boolean(errors.categoryId)}
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
                id="income-category"
                {...register("categoryId")}
              >
                {incomeCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date received" error={errors.occurredOn?.message} htmlFor="income-date">
              <Input
                aria-invalid={Boolean(errors.occurredOn)}
                id="income-date"
                type="date"
                {...register("occurredOn")}
              />
            </Field>
            <Field
              label="Reference (optional)"
              error={errors.reference?.message}
              htmlFor="income-reference"
            >
              <Input id="income-reference" maxLength={100} {...register("reference")} />
            </Field>
          </div>
          <Field
            label="Description"
            error={errors.description?.message}
            htmlFor="income-description"
          >
            <textarea
              aria-invalid={Boolean(errors.description)}
              className="min-h-24 w-full rounded-lg border border-input bg-background px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
              id="income-description"
              maxLength={1000}
              placeholder="Describe the income received"
              {...register("description")}
            />
          </Field>
          <p className="text-xs leading-5 text-muted-foreground">
            Enter a positive USD amount without separators, for example 1250.00.
          </p>
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Recording income…" : "Record income"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  children,
  error,
  htmlFor,
  label,
}: {
  children: React.ReactNode;
  error?: string;
  htmlFor: string;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function createIncomeEntrySchema(categoryIds: string[]) {
  return z.object({
    amount: z
      .string()
      .trim()
      .min(1, "Enter an income amount.")
      .superRefine((value, context) => {
        try {
          parseUsdToMinorUnits(value);
        } catch (error) {
          context.addIssue({
            code: "custom",
            message: error instanceof Error ? error.message : "Enter a valid income amount.",
          });
        }
      }),
    categoryId: z
      .string()
      .uuid("Select an income category.")
      .refine((categoryId) => categoryIds.includes(categoryId), "Select an income category."),
    description: z
      .string()
      .trim()
      .min(1, "Enter a description.")
      .max(1000, "Description must be 1000 characters or fewer."),
    occurredOn: z.iso.date("Select a valid received date."),
    reference: z.string().trim().max(100, "Reference must be 100 characters or fewer."),
  });
}

async function getErrorMessage(response: Response): Promise<string> {
  const error = (await response.json().catch(() => null)) as ApiError | null;
  const message = error?.message;

  return Array.isArray(message)
    ? message.join(" ")
    : (message ?? "We couldn't record the income entry. Please try again.");
}

export { IncomeEntryForm };
