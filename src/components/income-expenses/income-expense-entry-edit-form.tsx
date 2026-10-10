"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type {
  IncomeExpenseCategory,
  IncomeExpenseEntry,
  VendorOption,
} from "@/lib/income-expenses/income-expense-categories";
import { parseUsdToMinorUnits } from "@/lib/money/parse-usd-minor-units";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, PencilLine } from "lucide-react";
import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";

type IncomeExpenseEntryEditFormProps = {
  categories: IncomeExpenseCategory[];
  entry: IncomeExpenseEntry;
  onCancel: () => void;
  onSaved: () => void;
  vendors: VendorOption[];
  workspaceId: string;
};

type EntryEditFormValues = {
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

function IncomeExpenseEntryEditForm({
  categories,
  entry,
  onCancel,
  onSaved,
  vendors,
  workspaceId,
}: IncomeExpenseEntryEditFormProps) {
  const [requestError, setRequestError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDiscardConfirmationVisible, setIsDiscardConfirmationVisible] = useState(false);
  const matchingCategories = categories.filter((category) => category.type === entry.type);
  const formSchema = createEntryEditSchema(
    matchingCategories.map((category) => category.id),
    entry.type === "EXPENSE" ? vendors.map((vendor) => vendor.id) : [],
    entry.type,
  );
  const initialValues = getInitialValues(entry);
  const {
    formState: { errors, isDirty, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<EntryEditFormValues>({
    defaultValues: initialValues,
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(formSchema),
  });

  const onSubmit: SubmitHandler<EntryEditFormValues> = async (values) => {
    setRequestError(null);
    setSuccessMessage(null);
    setIsDiscardConfirmationVisible(false);

    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/income-expense-entries/${entry.id}`,
        {
          body: JSON.stringify({
            amountMinorUnits: parseUsdToMinorUnits(values.amount),
            categoryId: values.categoryId,
            currency: "USD",
            description: values.description.trim(),
            occurredOn: values.occurredOn,
            reference: values.reference.trim() === "" ? null : values.reference.trim(),
            vendorId: entry.type === "EXPENSE" && values.vendorId !== "" ? values.vendorId : null,
          }),
          headers: { "Content-Type": "application/json" },
          method: "PATCH",
        },
      );

      if (!response.ok) {
        setRequestError(await getErrorMessage(response));
        return;
      }

      reset(values);
      setSuccessMessage("Entry updated. The activity list has been refreshed.");
      onSaved();
    } catch (error) {
      setRequestError(
        error instanceof Error ? error.message : "We couldn't update the entry. Please try again.",
      );
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      setIsDiscardConfirmationVisible(true);
      return;
    }

    onCancel();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-control bg-primary/10 text-primary">
            <PencilLine aria-hidden="true" className="size-5" />
          </div>
          <div>
            <CardTitle as="h3">Edit {toDisplayType(entry.type).toLowerCase()} entry</CardTitle>
            <CardDescription className="mt-1">
              Update this entry&apos;s details. Its type remains {toDisplayType(entry.type)}.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" noValidate onSubmit={handleSubmit(onSubmit)}>
          {requestError ? <FormMessage kind="error">{requestError}</FormMessage> : null}
          {successMessage ? <FormMessage kind="success">{successMessage}</FormMessage> : null}
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Amount (USD)" error={errors.amount?.message} htmlFor="edit-entry-amount">
              <Input
                aria-invalid={Boolean(errors.amount)}
                autoComplete="off"
                id="edit-entry-amount"
                inputMode="decimal"
                {...register("amount")}
              />
            </Field>
            <Field
              label={`${toDisplayType(entry.type)} category`}
              error={errors.categoryId?.message}
              htmlFor="edit-entry-category"
            >
              <select
                aria-invalid={Boolean(errors.categoryId)}
                className={selectClassName}
                id="edit-entry-category"
                {...register("categoryId")}
              >
                {matchingCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>
            {entry.type === "EXPENSE" ? (
              <Field
                label="Vendor (optional)"
                error={errors.vendorId?.message}
                htmlFor="edit-entry-vendor"
              >
                <select
                  aria-invalid={Boolean(errors.vendorId)}
                  className={selectClassName}
                  id="edit-entry-vendor"
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
            ) : null}
            <Field
              label={entry.type === "INCOME" ? "Date received" : "Date paid"}
              error={errors.occurredOn?.message}
              htmlFor="edit-entry-date"
            >
              <Input
                aria-invalid={Boolean(errors.occurredOn)}
                id="edit-entry-date"
                type="date"
                {...register("occurredOn")}
              />
            </Field>
            <Field
              label="Reference (optional)"
              error={errors.reference?.message}
              htmlFor="edit-entry-reference"
            >
              <Input id="edit-entry-reference" maxLength={100} {...register("reference")} />
            </Field>
          </div>
          <Field
            label="Description"
            error={errors.description?.message}
            htmlFor="edit-entry-description"
          >
            <textarea
              aria-invalid={Boolean(errors.description)}
              className="min-h-24 w-full rounded-lg border border-input bg-background px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
              id="edit-entry-description"
              maxLength={1000}
              {...register("description")}
            />
          </Field>
          {isDiscardConfirmationVisible ? (
            <div
              className="rounded-control border border-amber-500/30 bg-amber-500/10 p-3"
              role="alert"
            >
              <div className="flex gap-3">
                <AlertTriangle
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-amber-700"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">Discard unsaved changes?</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Your updates to this financial entry will be lost.
                  </p>
                  <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row">
                    <Button
                      onClick={() => setIsDiscardConfirmationVisible(false)}
                      type="button"
                      variant="outline"
                    >
                      Keep editing
                    </Button>
                    <Button onClick={onCancel} type="button" variant="destructive">
                      Discard changes
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
            <Button disabled={isSubmitting} onClick={handleCancel} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "Saving changes…" : "Save changes"}
            </Button>
          </div>
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

function createEntryEditSchema(
  categoryIds: string[],
  vendorIds: string[],
  type: IncomeExpenseEntry["type"],
) {
  return z.object({
    amount: z
      .string()
      .trim()
      .min(1, "Enter an amount.")
      .superRefine((value, context) => {
        try {
          parseUsdToMinorUnits(value);
        } catch (error) {
          context.addIssue({
            code: "custom",
            message: error instanceof Error ? error.message : "Enter a valid amount.",
          });
        }
      }),
    categoryId: z
      .string()
      .uuid("Select a category.")
      .refine((categoryId) => categoryIds.includes(categoryId), "Select a category."),
    description: z
      .string()
      .trim()
      .min(1, "Enter a description.")
      .max(1000, "Description must be 1000 characters or fewer."),
    occurredOn: z.iso.date("Select a valid date."),
    reference: z.string().trim().max(100, "Reference must be 100 characters or fewer."),
    vendorId: z
      .string()
      .refine(
        (vendorId) => type === "INCOME" || vendorId === "" || vendorIds.includes(vendorId),
        "Select a vendor from this workspace.",
      ),
  });
}

function getInitialValues(entry: IncomeExpenseEntry): EntryEditFormValues {
  return {
    amount: minorUnitsToUsdInput(entry.amountMinorUnits),
    categoryId: entry.category.id,
    description: entry.description,
    occurredOn: entry.occurredOn,
    reference: entry.reference ?? "",
    vendorId: entry.vendor?.id ?? "",
  };
}

function minorUnitsToUsdInput(amountMinorUnits: string): string {
  const amount = BigInt(amountMinorUnits);
  const wholeUnits = amount / 100n;
  const fractionalUnits = (amount % 100n).toString().padStart(2, "0");

  return `${wholeUnits}.${fractionalUnits}`;
}

function toDisplayType(type: IncomeExpenseEntry["type"]): "Expense" | "Income" {
  return type === "INCOME" ? "Income" : "Expense";
}

async function getErrorMessage(response: Response): Promise<string> {
  const error = (await response.json().catch(() => null)) as ApiError | null;
  const message = error?.message;

  return Array.isArray(message)
    ? message.join(" ")
    : (message ?? "We couldn't update the entry. Please try again.");
}

export { IncomeExpenseEntryEditForm };
