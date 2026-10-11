"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type {
  BankAccount,
  BankAccountStatus,
  BankAccountType,
} from "@/lib/bank-accounts/bank-accounts";
import { formatUsdMinorUnits } from "@/lib/money/format-minor-units";
import { parseSignedUsdToMinorUnits } from "@/lib/money/parse-usd-minor-units";
import { zodResolver } from "@hookform/resolvers/zod";
import { Landmark, PencilLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";

type BankAccountFormProps = {
  account?: BankAccount;
  onCancel?: () => void;
  workspaceId: string;
};

type BankAccountFormValues = {
  accountLastFour: string;
  institutionName: string;
  name: string;
  openingBalance: string;
  openingBalanceDate: string;
  status: BankAccountStatus;
  type: BankAccountType;
};

type ApiError = {
  message?: string | string[];
};

const accountTypes = ["CASH", "CHECKING", "SAVINGS", "PAYMENT_PROCESSOR", "OTHER"] as const;
const accountStatuses = ["ACTIVE", "ARCHIVED"] as const;
const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20";

function BankAccountForm({ account, onCancel, workspaceId }: BankAccountFormProps) {
  const isEditing = account !== undefined;
  const [requestError, setRequestError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const formSchema = useMemo(() => createBankAccountSchema(isEditing), [isEditing]);
  const initialValues = useMemo(() => getInitialValues(account), [account]);
  const {
    formState: { errors, isDirty, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<BankAccountFormValues>({
    defaultValues: initialValues,
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(formSchema),
  });

  const onSubmit: SubmitHandler<BankAccountFormValues> = async (values) => {
    setRequestError(null);
    setSuccessMessage(null);

    const endpoint = isEditing
      ? `/api/workspaces/${workspaceId}/bank-accounts/${account.id}`
      : `/api/workspaces/${workspaceId}/bank-accounts`;
    const requestBody = isEditing
      ? {
          accountLastFour: optionalValue(values.accountLastFour),
          institutionName: optionalValue(values.institutionName),
          name: values.name.trim(),
          status: values.status,
        }
      : {
          accountLastFour: optionalValue(values.accountLastFour),
          currency: "USD",
          institutionName: optionalValue(values.institutionName),
          name: values.name.trim(),
          openingBalanceDate: optionalValue(values.openingBalanceDate),
          openingBalanceMinorUnits: parseSignedUsdToMinorUnits(values.openingBalance),
          type: values.type,
        };

    try {
      const response = await fetch(endpoint, {
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
        method: isEditing ? "PATCH" : "POST",
      });

      if (!response.ok) {
        setRequestError(await getErrorMessage(response));
        return;
      }

      if (isEditing) {
        reset(values);
        setSuccessMessage("Bank account updated. The account list has been refreshed.");
      } else {
        reset(getInitialValues());
        setSuccessMessage("Bank account created. The account list has been refreshed.");
      }

      router.refresh();
    } catch (error) {
      setRequestError(
        error instanceof Error
          ? error.message
          : "We couldn't save this bank account. Please try again.",
      );
    }
  };

  const handleCancel = () => {
    reset(initialValues);
    setRequestError(null);
    setSuccessMessage(null);
    onCancel?.();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-control bg-primary/10 text-primary">
            {isEditing ? (
              <PencilLine aria-hidden="true" className="size-5" />
            ) : (
              <Landmark aria-hidden="true" className="size-5" />
            )}
          </div>
          <div>
            <CardTitle as="h2">{isEditing ? "Edit bank account" : "Add bank account"}</CardTitle>
            <CardDescription className="mt-1">
              {isEditing
                ? "Update the account details that remain safe to change after creation."
                : "Record an account and its opening position before importing transactions."}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" noValidate onSubmit={handleSubmit(onSubmit)}>
          {requestError ? <FormMessage kind="error">{requestError}</FormMessage> : null}
          {successMessage ? <FormMessage kind="success">{successMessage}</FormMessage> : null}

          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Account name"
              error={errors.name?.message}
              htmlFor={`${formId(account)}-name`}
            >
              <Input
                aria-invalid={Boolean(errors.name)}
                autoComplete="off"
                id={`${formId(account)}-name`}
                maxLength={120}
                placeholder="Operating checking"
                {...register("name")}
              />
            </Field>

            {isEditing ? (
              <Field
                label="Status"
                error={errors.status?.message}
                htmlFor={`${formId(account)}-status`}
              >
                <select
                  aria-invalid={Boolean(errors.status)}
                  className={selectClassName}
                  id={`${formId(account)}-status`}
                  {...register("status")}
                >
                  {accountStatuses.map((status) => (
                    <option key={status} value={status}>
                      {toDisplayType(status)}
                    </option>
                  ))}
                </select>
              </Field>
            ) : (
              <Field
                label="Account type"
                error={errors.type?.message}
                htmlFor="create-bank-account-type"
              >
                <select
                  aria-invalid={Boolean(errors.type)}
                  className={selectClassName}
                  id="create-bank-account-type"
                  {...register("type")}
                >
                  {accountTypes.map((type) => (
                    <option key={type} value={type}>
                      {toDisplayType(type)}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <Field
              label="Institution (optional)"
              error={errors.institutionName?.message}
              htmlFor={`${formId(account)}-institution`}
            >
              <Input
                aria-invalid={Boolean(errors.institutionName)}
                autoComplete="organization"
                id={`${formId(account)}-institution`}
                maxLength={120}
                placeholder="Northstar Bank"
                {...register("institutionName")}
              />
            </Field>

            <Field
              label="Last four digits (optional)"
              error={errors.accountLastFour?.message}
              htmlFor={`${formId(account)}-last-four`}
            >
              <Input
                aria-invalid={Boolean(errors.accountLastFour)}
                autoComplete="off"
                id={`${formId(account)}-last-four`}
                inputMode="numeric"
                maxLength={4}
                placeholder="1234"
                {...register("accountLastFour")}
              />
            </Field>

            {isEditing ? (
              <AccountFacts account={account} />
            ) : (
              <>
                <Field
                  label="Opening balance (USD)"
                  error={errors.openingBalance?.message}
                  htmlFor="create-bank-account-opening-balance"
                >
                  <Input
                    aria-invalid={Boolean(errors.openingBalance)}
                    autoComplete="off"
                    id="create-bank-account-opening-balance"
                    inputMode="decimal"
                    placeholder="0.00"
                    {...register("openingBalance")}
                  />
                </Field>
                <Field
                  label="Opening balance date"
                  error={errors.openingBalanceDate?.message}
                  htmlFor="create-bank-account-opening-balance-date"
                >
                  <Input
                    aria-invalid={Boolean(errors.openingBalanceDate)}
                    id="create-bank-account-opening-balance-date"
                    type="date"
                    {...register("openingBalanceDate")}
                  />
                </Field>
              </>
            )}
          </div>

          {!isEditing ? (
            <p className="text-xs leading-5 text-muted-foreground">
              USD is the only supported currency currently. A non-zero opening balance requires an
              effective date. Use a minus sign for an overdrawn opening position.
            </p>
          ) : (
            <p className="text-xs leading-5 text-muted-foreground">
              Type, currency, and opening balance are immutable after creation. Archive an account
              instead of deleting it.
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
            {isEditing ? (
              <Button
                disabled={isSubmitting}
                onClick={handleCancel}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
            ) : null}
            <Button disabled={isSubmitting || (isEditing && !isDirty)} type="submit">
              {isSubmitting
                ? isEditing
                  ? "Saving changes…"
                  : "Creating account…"
                : isEditing
                  ? "Save changes"
                  : "Create account"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function AccountFacts({ account }: { account: BankAccount }) {
  return (
    <div className="rounded-control border border-border bg-muted/30 p-3 text-sm md:col-span-2">
      <p className="font-medium text-foreground">Creation details</p>
      <p className="mt-1 text-muted-foreground">
        {toDisplayType(account.type)} · {account.currency} · Opening balance{" "}
        {formatUsdMinorUnits(account.openingBalanceMinorUnits)}
        {account.openingBalanceDate ? ` effective ${account.openingBalanceDate}` : ""}
      </p>
    </div>
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

function createBankAccountSchema(isEditing: boolean) {
  const baseSchema = z.object({
    accountLastFour: z
      .string()
      .trim()
      .refine((value) => value === "" || /^\d{4}$/u.test(value), "Enter exactly four digits."),
    institutionName: z.string().trim().max(120, "Institution must be 120 characters or fewer."),
    name: z
      .string()
      .trim()
      .min(1, "Enter an account name.")
      .max(120, "Account name must be 120 characters or fewer."),
    openingBalance: z.string(),
    openingBalanceDate: z.string(),
    status: z.enum(accountStatuses),
    type: z.enum(accountTypes),
  });

  if (isEditing) {
    return baseSchema;
  }

  return baseSchema.superRefine((values, context) => {
    let openingBalanceMinorUnits: string;

    try {
      openingBalanceMinorUnits = parseSignedUsdToMinorUnits(values.openingBalance);
    } catch (error) {
      context.addIssue({
        code: "custom",
        message: error instanceof Error ? error.message : "Enter a valid opening balance.",
        path: ["openingBalance"],
      });
      return;
    }

    if (openingBalanceMinorUnits !== "0" && values.openingBalanceDate.trim() === "") {
      context.addIssue({
        code: "custom",
        message: "Choose an effective date for a non-zero opening balance.",
        path: ["openingBalanceDate"],
      });
      return;
    }

    if (
      values.openingBalanceDate.trim() !== "" &&
      !z.iso.date().safeParse(values.openingBalanceDate).success
    ) {
      context.addIssue({
        code: "custom",
        message: "Choose a valid opening balance date.",
        path: ["openingBalanceDate"],
      });
    }
  });
}

function getInitialValues(account?: BankAccount): BankAccountFormValues {
  return {
    accountLastFour: account?.accountLastFour ?? "",
    institutionName: account?.institutionName ?? "",
    name: account?.name ?? "",
    openingBalance: "0",
    openingBalanceDate: "",
    status: account?.status ?? "ACTIVE",
    type: account?.type ?? "CHECKING",
  };
}

function optionalValue(value: string): string | null {
  const trimmedValue = value.trim();

  return trimmedValue === "" ? null : trimmedValue;
}

function formId(account?: BankAccount): string {
  return account ? `edit-bank-account-${account.id}` : "create-bank-account";
}

function toDisplayType(value: BankAccountStatus | BankAccountType): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => `${word[0]?.toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

async function getErrorMessage(response: Response): Promise<string> {
  const error = (await response.json().catch(() => null)) as ApiError | null;
  const message = error?.message;

  return Array.isArray(message)
    ? message.join(" ")
    : (message ?? "We couldn't save this bank account. Please try again.");
}

export { BankAccountForm };
