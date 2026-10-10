"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type {
  IncomeExpenseCategory,
  VendorOption,
} from "@/lib/income-expenses/income-expense-categories";
import { parseUsdToMinorUnits } from "@/lib/money/parse-usd-minor-units";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleMinus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";

type ExpenseEntryFormProps = {
  canManage: boolean;
  categories: IncomeExpenseCategory[];
  initialOccurredOn: string;
  vendors: VendorOption[];
  workspaceId: string;
};

type ExpenseEntryFormValues = {
  amount: string;
  categoryId: string;
  description: string;
  occurredOn: string;
  reference: string;
  vendorId: string;
};

type ApiError = {
  message?: string | string[];
};

function ExpenseEntryForm({
  canManage,
  categories,
  initialOccurredOn,
  vendors,
  workspaceId,
}: ExpenseEntryFormProps) {
  const [requestError, setRequestError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const expenseCategories = useMemo(
    () => categories.filter((category) => category.type === "EXPENSE"),
    [categories],
  );
  const expenseEntrySchema = useMemo(
    () =>
      createExpenseEntrySchema(
        expenseCategories.map((category) => category.id),
        vendors.map((vendor) => vendor.id),
      ),
    [expenseCategories, vendors],
  );
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<ExpenseEntryFormValues>({
    defaultValues: getDefaultValues(expenseCategories, initialOccurredOn),
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(expenseEntrySchema),
  });

  const onSubmit: SubmitHandler<ExpenseEntryFormValues> = async (values) => {
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
          ...(values.vendorId === "" ? {} : { vendorId: values.vendorId }),
          type: "EXPENSE",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        setRequestError(await getErrorMessage(response));
        return;
      }

      reset(getDefaultValues(expenseCategories, initialOccurredOn));
      setSuccessMessage("Expense entry recorded.");
      router.refresh();
    } catch (error) {
      setRequestError(
        error instanceof Error
          ? error.message
          : "We couldn't record the expense entry. Please try again.",
      );
    }
  };

  if (!canManage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle as="h2">Record expense</CardTitle>
          <CardDescription>
            Your workspace role allows viewing entries, but not recording them.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (expenseCategories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle as="h2">Record expense</CardTitle>
          <CardDescription>
            Add an expense category above before recording an expense entry.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-control bg-danger/10 text-danger">
            <CircleMinus aria-hidden="true" className="size-5" />
          </div>
          <div>
            <CardTitle as="h2">Record expense</CardTitle>
            <CardDescription className="mt-1">
              Record a completed expense in USD and optionally associate its vendor.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" noValidate onSubmit={handleSubmit(onSubmit)}>
          {requestError ? <FormMessage kind="error">{requestError}</FormMessage> : null}
          {successMessage ? <FormMessage kind="success">{successMessage}</FormMessage> : null}
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Amount (USD)" error={errors.amount?.message} htmlFor="expense-amount">
              <Input
                aria-invalid={Boolean(errors.amount)}
                autoComplete="off"
                id="expense-amount"
                inputMode="decimal"
                placeholder="1250.00"
                {...register("amount")}
              />
            </Field>
            <Field
              label="Expense category"
              error={errors.categoryId?.message}
              htmlFor="expense-category"
            >
              <select
                aria-invalid={Boolean(errors.categoryId)}
                className={selectClassName}
                id="expense-category"
                {...register("categoryId")}
              >
                {expenseCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Vendor (optional)"
              error={errors.vendorId?.message}
              htmlFor="expense-vendor"
            >
              <select
                aria-invalid={Boolean(errors.vendorId)}
                className={selectClassName}
                id="expense-vendor"
                {...register("vendorId")}
              >
                <option value="">No vendor selected</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date paid" error={errors.occurredOn?.message} htmlFor="expense-date">
              <Input
                aria-invalid={Boolean(errors.occurredOn)}
                id="expense-date"
                type="date"
                {...register("occurredOn")}
              />
            </Field>
            <Field
              label="Reference (optional)"
              error={errors.reference?.message}
              htmlFor="expense-reference"
            >
              <Input id="expense-reference" maxLength={100} {...register("reference")} />
            </Field>
          </div>
          <Field
            label="Description"
            error={errors.description?.message}
            htmlFor="expense-description"
          >
            <textarea
              aria-invalid={Boolean(errors.description)}
              className="min-h-24 w-full rounded-lg border border-input bg-background px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
              id="expense-description"
              maxLength={1000}
              placeholder="Describe the expense paid"
              {...register("description")}
            />
          </Field>
          <p className="text-xs leading-5 text-muted-foreground">
            Enter a positive USD amount without separators, for example 1250.00.
          </p>
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Recording expense…" : "Record expense"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20";

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

function FormMessage({ children, kind }: { children: React.ReactNode; kind: "error" | "success" }) {
  const className =
    kind === "error"
      ? "border-danger/25 bg-danger/10 text-danger"
      : "border-success/25 bg-success/10 text-success";

  return (
    <p
      className={`rounded-control border px-3 py-2 text-sm ${className}`}
      role={kind === "error" ? "alert" : "status"}
    >
      {children}
    </p>
  );
}

function getDefaultValues(
  expenseCategories: IncomeExpenseCategory[],
  initialOccurredOn: string,
): ExpenseEntryFormValues {
  return {
    amount: "",
    categoryId: expenseCategories[0]?.id ?? "",
    description: "",
    occurredOn: initialOccurredOn,
    reference: "",
    vendorId: "",
  };
}

function createExpenseEntrySchema(categoryIds: string[], vendorIds: string[]) {
  return z.object({
    amount: z
      .string()
      .trim()
      .min(1, "Enter an expense amount.")
      .superRefine((value, context) => {
        try {
          parseUsdToMinorUnits(value);
        } catch (error) {
          context.addIssue({
            code: "custom",
            message: error instanceof Error ? error.message : "Enter a valid expense amount.",
          });
        }
      }),
    categoryId: z
      .string()
      .uuid("Select an expense category.")
      .refine((categoryId) => categoryIds.includes(categoryId), "Select an expense category."),
    description: z
      .string()
      .trim()
      .min(1, "Enter a description.")
      .max(1000, "Description must be 1000 characters or fewer."),
    occurredOn: z.iso.date("Select a valid paid date."),
    reference: z.string().trim().max(100, "Reference must be 100 characters or fewer."),
    vendorId: z
      .string()
      .refine(
        (vendorId) => vendorId === "" || vendorIds.includes(vendorId),
        "Select a vendor from this workspace.",
      ),
  });
}

async function getErrorMessage(response: Response): Promise<string> {
  const error = (await response.json().catch(() => null)) as ApiError | null;
  const message = error?.message;

  return Array.isArray(message)
    ? message.join(" ")
    : (message ?? "We couldn't record the expense entry. Please try again.");
}

export { ExpenseEntryForm };
