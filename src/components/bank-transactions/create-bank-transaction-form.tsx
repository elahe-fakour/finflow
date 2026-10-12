"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { BankAccount } from "@/lib/bank-accounts/bank-accounts";
import {
  createBankTransactionPayload,
  type BankTransactionDirection,
  type CreateBankTransactionValues,
} from "@/lib/bank-transactions/create-bank-transaction";
import { zodResolver } from "@hookform/resolvers/zod";
import { Landmark } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";

type CreateBankTransactionFormProps = {
  accounts: BankAccount[];
  workspaceId: string;
};

type ApiError = {
  message?: string | string[];
};

const directions: { description: string; label: string; value: BankTransactionDirection }[] = [
  { description: "Money received", label: "Inflow", value: "INFLOW" },
  { description: "Money paid", label: "Outflow", value: "OUTFLOW" },
];

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20";

function CreateBankTransactionForm({ accounts, workspaceId }: CreateBankTransactionFormProps) {
  const router = useRouter();
  const [requestError, setRequestError] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<CreateBankTransactionValues>({
    defaultValues: {
      amount: "",
      bankAccountId: accounts[0]?.id ?? "",
      description: "",
      direction: "OUTFLOW",
      reference: "",
      transactionDate: new Date().toISOString().slice(0, 10),
    },
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(createBankTransactionSchema(accounts.map((account) => account.id))),
  });

  const onSubmit: SubmitHandler<CreateBankTransactionValues> = async (values) => {
    setRequestError(null);

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/bank-transactions`, {
        body: JSON.stringify(createBankTransactionPayload(values)),
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        method: "POST",
      });

      if (!response.ok) {
        setRequestError(await getErrorMessage(response));
        return;
      }

      const transaction = (await response.json()) as { id: string };
      router.push(`/transactions/${transaction.id}`);
    } catch (error) {
      setRequestError(
        error instanceof Error
          ? error.message
          : "We couldn't record this transaction. Please try again.",
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-control bg-primary/10 text-primary">
            <Landmark aria-hidden="true" className="size-5" />
          </div>
          <div>
            <CardTitle as="h2">Record transaction</CardTitle>
            <CardDescription className="mt-1">
              Add a manual inflow or outflow. Amounts are stored exactly as integer minor units.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" noValidate onSubmit={handleSubmit(onSubmit)}>
          {requestError ? <FormMessage>{requestError}</FormMessage> : null}
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              error={errors.bankAccountId?.message}
              htmlFor="transaction-bank-account"
              label="Bank account"
            >
              <select
                aria-invalid={Boolean(errors.bankAccountId)}
                className={selectClassName}
                id="transaction-bank-account"
                {...register("bankAccountId")}
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              error={errors.direction?.message}
              htmlFor="transaction-direction"
              label="Direction"
            >
              <select
                aria-invalid={Boolean(errors.direction)}
                className={selectClassName}
                id="transaction-direction"
                {...register("direction")}
              >
                {directions.map((direction) => (
                  <option key={direction.value} value={direction.value}>
                    {direction.label} — {direction.description}
                  </option>
                ))}
              </select>
            </Field>
            <Field error={errors.amount?.message} htmlFor="transaction-amount" label="Amount (USD)">
              <Input
                aria-invalid={Boolean(errors.amount)}
                autoComplete="off"
                id="transaction-amount"
                inputMode="decimal"
                placeholder="1250.00"
                {...register("amount")}
              />
            </Field>
            <Field
              error={errors.transactionDate?.message}
              htmlFor="transaction-date"
              label="Transaction date"
            >
              <Input
                aria-invalid={Boolean(errors.transactionDate)}
                id="transaction-date"
                type="date"
                {...register("transactionDate")}
              />
            </Field>
            <Field
              error={errors.description?.message}
              htmlFor="transaction-description"
              label="Description"
            >
              <Input
                aria-invalid={Boolean(errors.description)}
                autoComplete="off"
                id="transaction-description"
                maxLength={1000}
                placeholder="Contractor payment"
                {...register("description")}
              />
            </Field>
            <Field
              error={errors.reference?.message}
              htmlFor="transaction-reference"
              label="Reference (optional)"
            >
              <Input
                aria-invalid={Boolean(errors.reference)}
                autoComplete="off"
                id="transaction-reference"
                maxLength={100}
                placeholder="ACH-4242"
                {...register("reference")}
              />
            </Field>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            Inflow is stored as a positive amount; outflow is stored as a negative amount. FinFlow
            does not use floating-point values for money.
          </p>
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Recording transaction…" : "Record transaction"}
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

function FormMessage({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="rounded-control border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger"
      role="alert"
    >
      {children}
    </p>
  );
}

function createBankTransactionSchema(accountIds: string[]) {
  return z.object({
    amount: z
      .string()
      .trim()
      .superRefine((value, context) => {
        try {
          createBankTransactionPayload({
            amount: value,
            bankAccountId: accountIds[0] ?? "",
            description: "Validation",
            direction: "INFLOW",
            reference: "",
            transactionDate: "2026-01-01",
          });
        } catch (error) {
          context.addIssue({
            code: "custom",
            message: error instanceof Error ? error.message : "Enter a valid amount.",
          });
        }
      }),
    bankAccountId: z
      .string()
      .refine((value) => accountIds.includes(value), "Choose an active bank account."),
    description: z
      .string()
      .trim()
      .min(1, "Enter a description.")
      .max(1000, "Description must be 1000 characters or fewer."),
    direction: z.enum(["INFLOW", "OUTFLOW"]),
    reference: z.string().trim().max(100, "Reference must be 100 characters or fewer."),
    transactionDate: z
      .string()
      .refine((value) => z.iso.date().safeParse(value).success, "Choose a valid transaction date."),
  });
}

async function getErrorMessage(response: Response): Promise<string> {
  const error = (await response.json().catch(() => null)) as ApiError | null;
  const message = error?.message;

  return Array.isArray(message)
    ? message.join(" ")
    : (message ?? "We couldn't record this transaction. Please try again.");
}

export { CreateBankTransactionForm };
