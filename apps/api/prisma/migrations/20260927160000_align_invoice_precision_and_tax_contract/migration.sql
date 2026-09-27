-- Preserve the published invoice-calculation contract: quantities allow up to
-- six decimal places, and tax policy currently permits any non-negative rate.
ALTER TABLE "invoice_line_items"
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(18,6);

ALTER TABLE "invoice_line_items"
DROP CONSTRAINT "invoice_line_items_tax_rate_range_check";

ALTER TABLE "invoice_line_items"
ADD CONSTRAINT "invoice_line_items_tax_rate_non_negative_check" CHECK (
    "tax_rate_basis_points" >= 0
);
