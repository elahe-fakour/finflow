import { z } from "zod";

const customerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Customer name is required.")
    .max(120, "Customer name must be 120 characters or fewer."),
  contactName: z
    .string()
    .trim()
    .min(1, "Contact name is required.")
    .max(120, "Contact name must be 120 characters or fewer."),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .max(254, "Email address must be 254 characters or fewer."),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

const customerFormDefaultValues: CustomerFormValues = {
  name: "",
  contactName: "",
  email: "",
};

export { customerFormDefaultValues, customerFormSchema, type CustomerFormValues };
