"use client";

import {
  customerFormDefaultValues,
  customerFormSchema,
  type CustomerFormValues,
} from "@/components/customers/customer-form-schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import {
  useForm,
  type SubmitErrorHandler,
  type SubmitHandler,
  type UseFormRegisterReturn,
} from "react-hook-form";

type FormStatus = "idle" | "invalid" | "valid";

type CustomerFormFieldProps = {
  autoComplete: string;
  error?: string;
  hint: string;
  id: "customer-name" | "customer-contact-name" | "customer-email";
  label: string;
  registration: UseFormRegisterReturn;
  type?: "email" | "text";
};

function CustomerFormField({
  autoComplete,
  error,
  hint,
  id,
  label,
  registration,
  type = "text",
}: CustomerFormFieldProps) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground" htmlFor={id}>
        {label}
      </label>
      <Input
        aria-describedby={error ? `${hintId} ${errorId}` : hintId}
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        id={id}
        type={type}
        {...registration}
      />
      <p className="text-sm text-muted-foreground" id={hintId}>
        {hint}
      </p>
      {error ? (
        <p className="text-sm text-destructive" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function CustomerCreateForm() {
  const [formStatus, setFormStatus] = useState<FormStatus>("idle");
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<CustomerFormValues>({
    defaultValues: customerFormDefaultValues,
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(customerFormSchema),
  });

  const onSubmit: SubmitHandler<CustomerFormValues> = () => {
    setFormStatus("valid");
  };

  const onInvalid: SubmitErrorHandler<CustomerFormValues> = () => {
    setFormStatus("invalid");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Customer details</CardTitle>
        <CardDescription>
          Enter the contact information for the customer you want to add.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
              Review the highlighted fields before continuing.
            </p>
          ) : null}

          {formStatus === "valid" ? (
            <p
              aria-live="polite"
              className="rounded-control border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground"
              role="status"
            >
              The details are valid. Customer records cannot be saved until the API and database are
              introduced.
            </p>
          ) : null}

          <CustomerFormField
            autoComplete="organization"
            error={errors.name?.message}
            hint="Use the business or customer name that should appear on invoices."
            id="customer-name"
            label="Customer name"
            registration={register("name")}
          />

          <CustomerFormField
            autoComplete="name"
            error={errors.contactName?.message}
            hint="Add the primary person FinFlow should associate with this customer."
            id="customer-contact-name"
            label="Contact name"
            registration={register("contactName")}
          />

          <CustomerFormField
            autoComplete="email"
            error={errors.email?.message}
            hint="Use an email address for future invoice delivery and payment communication."
            id="customer-email"
            label="Email address"
            registration={register("email")}
            type="email"
          />

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" variant="outline">
              <Link href="/customers">Cancel</Link>
            </Button>
            <Button size="lg" type="submit">
              Validate customer details
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export { CustomerCreateForm };
