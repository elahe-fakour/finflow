import { vendorCategories } from "@/components/vendors/vendor-sample-data";
import { z } from "zod";

const vendorFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Vendor name is required.")
    .max(120, "Vendor name must be 120 characters or fewer."),
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
  category: z.enum(vendorCategories, "Select a vendor category."),
});

type VendorFormValues = z.infer<typeof vendorFormSchema>;

const vendorFormDefaultValues = {
  name: "",
  contactName: "",
  email: "",
} satisfies Partial<VendorFormValues>;

export { vendorFormDefaultValues, vendorFormSchema, type VendorFormValues };
