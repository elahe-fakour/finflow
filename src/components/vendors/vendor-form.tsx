"use client";

import {
  vendorFormDefaultValues,
  vendorFormSchema,
  type VendorFormValues,
} from "@/components/vendors/vendor-form-schema";
import { vendorCategories } from "@/components/vendors/vendor-sample-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  useForm,
  type SubmitErrorHandler,
  type SubmitHandler,
  type UseFormRegisterReturn,
} from "react-hook-form";

type FormStatus = "idle" | "invalid" | "valid";
type VendorFormMode = "create" | "edit";

type VendorFormProps = {
  initialValues?: Partial<VendorFormValues>;
  mode: VendorFormMode;
  returnHref: string;
};

type VendorFormFieldProps = {
  autoComplete: string;
  error?: string;
  hint: string;
  id: "vendor-name" | "vendor-contact-name" | "vendor-email";
  label: string;
  registration: UseFormRegisterReturn;
  type?: "email" | "text";
};

function VendorFormField({
  autoComplete,
  error,
  hint,
  id,
  label,
  registration,
  type = "text",
}: VendorFormFieldProps) {
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

function VendorForm({
  initialValues = vendorFormDefaultValues,
  mode,
  returnHref,
}: VendorFormProps) {
  const [formStatus, setFormStatus] = useState<FormStatus>("idle");
  const [isDiscardConfirmationVisible, setIsDiscardConfirmationVisible] = useState(false);
  const router = useRouter();
  const {
    formState: { errors, isDirty },
    handleSubmit,
    register,
    reset,
  } = useForm<VendorFormValues>({
    defaultValues: initialValues,
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(vendorFormSchema),
  });
  const hasUnsavedChanges = mode === "edit" && isDirty;
  const isEditing = mode === "edit";

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const onSubmit: SubmitHandler<VendorFormValues> = () => {
    setFormStatus("valid");
  };

  const onInvalid: SubmitErrorHandler<VendorFormValues> = () => {
    setFormStatus("invalid");
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setIsDiscardConfirmationVisible(true);
      return;
    }

    router.push(returnHref);
  };

  const handleDiscardChanges = () => {
    reset(initialValues);
    router.push(returnHref);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Vendor details</CardTitle>
        <CardDescription>
          {isEditing
            ? "Update the contact information and category for this vendor."
            : "Enter the contact information and category for the vendor you want to add."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-6"
          noValidate
          onChange={() => {
            setFormStatus("idle");
            setIsDiscardConfirmationVisible(false);
          }}
          onSubmit={handleSubmit(onSubmit, onInvalid)}
        >
          {hasUnsavedChanges && formStatus !== "valid" ? (
            <p
              aria-live="polite"
              className="rounded-control border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-foreground"
              role="status"
            >
              You have unsaved changes.
            </p>
          ) : null}

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
              {isEditing
                ? "The changes are valid but remain unsaved."
                : "The details are valid but remain unsaved."}{" "}
              Vendor records cannot be saved until the API and database are introduced.
            </p>
          ) : null}

          <VendorFormField
            autoComplete="organization"
            error={errors.name?.message}
            hint="Use the name that should appear on future expenses and payable records."
            id="vendor-name"
            label="Vendor name"
            registration={register("name")}
          />

          <VendorFormField
            autoComplete="name"
            error={errors.contactName?.message}
            hint="Add the primary person FinFlow should associate with this vendor."
            id="vendor-contact-name"
            label="Contact name"
            registration={register("contactName")}
          />

          <VendorFormField
            autoComplete="email"
            error={errors.email?.message}
            hint="Use an email address for future bill and payment communication."
            id="vendor-email"
            label="Email address"
            registration={register("email")}
            type="email"
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="vendor-category">
              Category
            </label>
            <select
              aria-describedby={
                errors.category
                  ? "vendor-category-hint vendor-category-error"
                  : "vendor-category-hint"
              }
              aria-invalid={Boolean(errors.category)}
              className="h-10 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
              id="vendor-category"
              {...register("category")}
            >
              <option disabled value="">
                Select a category
              </option>
              {vendorCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <p className="text-sm text-muted-foreground" id="vendor-category-hint">
              Categories will support reporting and expense classification in later milestones.
            </p>
            {errors.category ? (
              <p className="text-sm text-destructive" id="vendor-category-error" role="alert">
                {errors.category.message}
              </p>
            ) : null}
          </div>

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
                    Your edits will be lost because vendor records are not saved yet.
                  </p>
                  <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row">
                    <Button
                      onClick={() => setIsDiscardConfirmationVisible(false)}
                      type="button"
                      variant="outline"
                    >
                      Keep editing
                    </Button>
                    <Button onClick={handleDiscardChanges} type="button" variant="destructive">
                      Discard changes
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
            <Button onClick={handleCancel} size="lg" type="button" variant="outline">
              Cancel
            </Button>
            <Button size="lg" type="submit">
              {isEditing ? "Validate changes" : "Validate vendor details"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export { VendorForm };
