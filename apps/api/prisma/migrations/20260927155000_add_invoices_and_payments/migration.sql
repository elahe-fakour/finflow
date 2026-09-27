-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvoiceLineDiscountKind" AS ENUM ('FLAT', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'CASH', 'CARD', 'OTHER');

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "invoice_number" VARCHAR(64) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "issue_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "subtotal_minor_units" BIGINT NOT NULL,
    "discount_minor_units" BIGINT NOT NULL,
    "tax_minor_units" BIGINT NOT NULL,
    "total_minor_units" BIGINT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "invoices_invoice_number_not_blank_check" CHECK (btrim("invoice_number") <> ''),
    CONSTRAINT "invoices_due_date_after_issue_date_check" CHECK ("due_date" >= "issue_date"),
    CONSTRAINT "invoices_currency_iso_code_check" CHECK ("currency" ~ '^[A-Z]{3}$'),
    CONSTRAINT "invoices_amounts_non_negative_check" CHECK (
        "subtotal_minor_units" >= 0
        AND "discount_minor_units" >= 0
        AND "tax_minor_units" >= 0
        AND "total_minor_units" >= 0
    ),
    CONSTRAINT "invoices_discount_not_greater_than_subtotal_check" CHECK (
        "discount_minor_units" <= "subtotal_minor_units"
    ),
    CONSTRAINT "invoices_total_matches_components_check" CHECK (
        "total_minor_units" = "subtotal_minor_units" - "discount_minor_units" + "tax_minor_units"
    )
);

-- CreateTable
CREATE TABLE "invoice_line_items" (
    "id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "description" VARCHAR(1000) NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "unit_price_minor_units" BIGINT NOT NULL,
    "tax_rate_basis_points" INTEGER NOT NULL DEFAULT 0,
    "discount_kind" "InvoiceLineDiscountKind",
    "discount_flat_minor_units" BIGINT,
    "discount_rate_basis_points" INTEGER,
    "subtotal_minor_units" BIGINT NOT NULL,
    "discount_minor_units" BIGINT NOT NULL,
    "tax_minor_units" BIGINT NOT NULL,
    "total_minor_units" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "invoice_line_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "invoice_line_items_position_positive_check" CHECK ("position" >= 1),
    CONSTRAINT "invoice_line_items_description_not_blank_check" CHECK (btrim("description") <> ''),
    CONSTRAINT "invoice_line_items_quantity_positive_check" CHECK ("quantity" > 0),
    CONSTRAINT "invoice_line_items_unit_price_non_negative_check" CHECK ("unit_price_minor_units" >= 0),
    CONSTRAINT "invoice_line_items_tax_rate_range_check" CHECK (
        "tax_rate_basis_points" BETWEEN 0 AND 10000
    ),
    CONSTRAINT "invoice_line_items_amounts_non_negative_check" CHECK (
        "subtotal_minor_units" >= 0
        AND "discount_minor_units" >= 0
        AND "tax_minor_units" >= 0
        AND "total_minor_units" >= 0
    ),
    CONSTRAINT "invoice_line_items_discount_not_greater_than_subtotal_check" CHECK (
        "discount_minor_units" <= "subtotal_minor_units"
    ),
    CONSTRAINT "invoice_line_items_total_matches_components_check" CHECK (
        "total_minor_units" = "subtotal_minor_units" - "discount_minor_units" + "tax_minor_units"
    ),
    CONSTRAINT "invoice_line_items_discount_shape_check" CHECK (
        (
            "discount_kind" IS NULL
            AND "discount_flat_minor_units" IS NULL
            AND "discount_rate_basis_points" IS NULL
        )
        OR (
            "discount_kind" = 'FLAT'
            AND "discount_flat_minor_units" IS NOT NULL
            AND "discount_flat_minor_units" >= 0
            AND "discount_flat_minor_units" <= "subtotal_minor_units"
            AND "discount_rate_basis_points" IS NULL
        )
        OR (
            "discount_kind" = 'PERCENTAGE'
            AND "discount_flat_minor_units" IS NULL
            AND "discount_rate_basis_points" IS NOT NULL
            AND "discount_rate_basis_points" BETWEEN 0 AND 10000
        )
    )
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "amount_minor_units" BIGINT NOT NULL,
    "received_at" TIMESTAMPTZ(3) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "reference" VARCHAR(100),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "payments_amount_positive_check" CHECK ("amount_minor_units" > 0)
);

-- CreateIndex
CREATE INDEX "invoices_workspace_id_customer_id_idx" ON "invoices"("workspace_id", "customer_id");

-- CreateIndex
CREATE INDEX "invoices_workspace_id_status_due_date_idx" ON "invoices"("workspace_id", "status", "due_date");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_workspace_id_id_key" ON "invoices"("workspace_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_workspace_id_invoice_number_key" ON "invoices"("workspace_id", "invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_line_items_invoice_id_position_key" ON "invoice_line_items"("invoice_id", "position");

-- CreateIndex
CREATE INDEX "payments_workspace_id_invoice_id_idx" ON "payments"("workspace_id", "invoice_id");

-- CreateIndex
CREATE INDEX "payments_workspace_id_received_at_idx" ON "payments"("workspace_id", "received_at");

-- CreateIndex
CREATE UNIQUE INDEX "customers_workspace_id_id_key" ON "customers"("workspace_id", "id");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_workspace_id_customer_id_fkey" FOREIGN KEY ("workspace_id", "customer_id") REFERENCES "customers"("workspace_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_workspace_id_invoice_id_fkey" FOREIGN KEY ("workspace_id", "invoice_id") REFERENCES "invoices"("workspace_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
