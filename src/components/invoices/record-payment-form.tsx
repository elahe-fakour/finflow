"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { calculateInvoiceBalance } from "@/features/invoices/invoice-status";
import {
  paymentMethods,
  type InvoiceStatus,
  type Payment,
  type PaymentMethod,
} from "@/features/invoices/invoice-types";
import { formatMoney, parseMoneyInput, type Money } from "@/features/invoices/money";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleDollarSign } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm, type SubmitErrorHandler, type SubmitHandler } from "react-hook-form";
import { z } from "zod";

type FormStatus = "idle" | "invalid" | "valid";

type RecordPaymentFormProps = {
  existingPayments: readonly Pick<Payment, "amount">[];
  invoiceNumber: string;
  invoiceStatus: InvoiceStatus;
  invoiceTotal: Money;
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  "bank-transfer": "Bank transfer",
  card: "Card",
  cash: "Cash",
  other: "Other",
};

type RecordPaymentFormValues = {
  amount: string;
  method: PaymentMethod;
  receivedAt: string;
  reference: string;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "This payment amount is invalid.";
}

function getUnavailableMessage(invoiceStatus: InvoiceStatus, outstanding: Money) {
  if (invoiceStatus === "draft") {
    return "Send this invoice before recording a payment against it.";
  }

  if (invoiceStatus === "cancelled") {
    return "Cancelled invoices cannot receive new payments.";
  }

  if (outstanding.amountMinorUnits === 0) {
    return "This invoice has no outstanding balance.";
  }

  return "Payments can be recorded only for sent or overdue invoices.";
}

function createRecordPaymentFormSchema(
  invoiceTotal: Money,
  existingPayments: readonly Pick<Payment, "amount">[],
) {
  return z.object({
    amount: z
      .string()
      .trim()
      .min(1, "Enter a payment amount.")
      .superRefine((value, context) => {
        try {
          const amount = parseMoneyInput(value, invoiceTotal.currency);

          if (amount.amountMinorUnits === 0) {
            context.addIssue({
              code: "custom",
              message: "Payment amount must be greater than zero.",
            });
            return;
          }

          calculateInvoiceBalance(invoiceTotal, [...existingPayments, { amount }]);
        } catch (error) {
          context.addIssue({
            code: "custom",
            message: getErrorMessage(error),
          });
        }
      }),
    method: z.enum(paymentMethods, "Select a payment method."),
    receivedAt: z.string().min(1, "Select the date the payment was received."),
    reference: z.string().trim().max(120, "Reference must be 120 characters or fewer."),
  });
}

function RecordPaymentForm({
  existingPayments,
  invoiceNumber,
  invoiceStatus,
  invoiceTotal,
}: RecordPaymentFormProps) {
  const [formStatus, setFormStatus] = useState<FormStatus>("idle");
  const outstanding = useMemo(
    () => calculateInvoiceBalance(invoiceTotal, existingPayments).outstanding,
    [existingPayments, invoiceTotal],
  );
  const canRecordPayment =
    (invoiceStatus === "sent" || invoiceStatus === "overdue") && outstanding.amountMinorUnits > 0;
  const paymentFormSchema = useMemo(
    () => createRecordPaymentFormSchema(invoiceTotal, existingPayments),
    [existingPayments, invoiceTotal],
  );
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<RecordPaymentFormValues>({
    defaultValues: {
      amount: "",
      method: "bank-transfer",
      receivedAt: "",
      reference: "",
    },
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(paymentFormSchema),
  });

  const onSubmit: SubmitHandler<RecordPaymentFormValues> = () => {
    setFormStatus("valid");
  };

  const onInvalid: SubmitErrorHandler<RecordPaymentFormValues> = () => {
    setFormStatus("invalid");
  };

  const amountHintId = "payment-amount-hint";
  const amountErrorId = "payment-amount-error";
  const methodErrorId = "payment-method-error";
  const receivedAtHintId = "payment-received-at-hint";
  const receivedAtErrorId = "payment-received-at-error";
  const referenceHintId = "payment-reference-hint";
  const referenceErrorId = "payment-reference-error";

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Record payment</CardTitle>
        <CardDescription>
          {canRecordPayment
            ? `Validate a payment against the ${formatMoney(outstanding)} outstanding balance on ${invoiceNumber}.`
            : `Payment recording is unavailable for ${invoiceNumber}.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {canRecordPayment ? (
          <form
            className="space-y-6"
            noValidate
            onChange={() => setFormStatus("idle")}
            onSubmit={handleSubmit(onSubmit, onInvalid)}
          >
            {formStatus === "invalid" ? (
              <p
                className="rounded-control border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                Review the highlighted payment fields before continuing.
              </p>
            ) : null}

            {formStatus === "valid" ? (
              <p
                aria-live="polite"
                className="rounded-control border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground"
                role="status"
              >
                The payment is valid but has not been recorded. Payment persistence is introduced in
                a later task.
              </p>
            ) : null}

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="payment-amount">
                  Amount
                </label>
                <Input
                  aria-describedby={
                    errors.amount ? `${amountHintId} ${amountErrorId}` : amountHintId
                  }
                  aria-invalid={Boolean(errors.amount)}
                  autoComplete="off"
                  id="payment-amount"
                  inputMode="decimal"
                  placeholder="0.00"
                  {...register("amount")}
                />
                <p className="text-sm text-muted-foreground" id={amountHintId}>
                  Enter {invoiceTotal.currency} without separators, for example 1250.00. It cannot
                  exceed {formatMoney(outstanding)}.
                </p>
                {errors.amount ? (
                  <p className="text-sm text-destructive" id={amountErrorId} role="alert">
                    {errors.amount.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="payment-method">
                  Payment method
                </label>
                <select
                  aria-describedby={errors.method ? methodErrorId : undefined}
                  aria-invalid={Boolean(errors.method)}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
                  id="payment-method"
                  {...register("method")}
                >
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {paymentMethodLabels[method]}
                    </option>
                  ))}
                </select>
                {errors.method ? (
                  <p className="text-sm text-destructive" id={methodErrorId} role="alert">
                    {errors.method.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor="payment-received-at"
                >
                  Received date
                </label>
                <Input
                  aria-describedby={
                    errors.receivedAt
                      ? `${receivedAtHintId} ${receivedAtErrorId}`
                      : receivedAtHintId
                  }
                  aria-invalid={Boolean(errors.receivedAt)}
                  id="payment-received-at"
                  type="date"
                  {...register("receivedAt")}
                />
                <p className="text-sm text-muted-foreground" id={receivedAtHintId}>
                  Use the date the funds were received.
                </p>
                {errors.receivedAt ? (
                  <p className="text-sm text-destructive" id={receivedAtErrorId} role="alert">
                    {errors.receivedAt.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="payment-reference">
                  Reference <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <Input
                  aria-describedby={
                    errors.reference ? `${referenceHintId} ${referenceErrorId}` : referenceHintId
                  }
                  aria-invalid={Boolean(errors.reference)}
                  autoComplete="off"
                  id="payment-reference"
                  placeholder="Bank or processor reference"
                  {...register("reference")}
                />
                <p className="text-sm text-muted-foreground" id={referenceHintId}>
                  Keep the external reference for future reconciliation.
                </p>
                {errors.reference ? (
                  <p className="text-sm text-destructive" id={referenceErrorId} role="alert">
                    {errors.reference.message}
                  </p>
                ) : null}
              </div>
            </div>

            <Button size="lg" type="submit">
              Validate payment
            </Button>
          </form>
        ) : (
          <div
            className="flex gap-3 rounded-control border border-border bg-muted/40 p-3 text-sm leading-6 text-muted-foreground"
            role="status"
          >
            <CircleDollarSign aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>{getUnavailableMessage(invoiceStatus, outstanding)}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { RecordPaymentForm };
