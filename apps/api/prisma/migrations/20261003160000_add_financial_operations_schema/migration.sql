-- CreateEnum
CREATE TYPE "IncomeExpenseType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "BankAccountType" AS ENUM ('CHECKING', 'SAVINGS', 'CASH', 'PAYMENT_PROCESSOR', 'OTHER');

-- CreateEnum
CREATE TYPE "BankAccountStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('CONFIRMED', 'REVERSED');

-- CreateEnum
CREATE TYPE "ReconciliationMatchType" AS ENUM ('SUGGESTED', 'MANUAL');

-- CreateTable
CREATE TABLE "income_expense_entries" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "vendor_id" UUID,
    "entry_type" "IncomeExpenseType" NOT NULL,
    "amount_minor_units" BIGINT NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "occurred_on" DATE NOT NULL,
    "description" VARCHAR(1000) NOT NULL,
    "reference" VARCHAR(100),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "income_expense_entries_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "income_expense_entries_amount_positive_check" CHECK ("amount_minor_units" > 0),
    CONSTRAINT "income_expense_entries_currency_iso_code_check" CHECK ("currency" ~ '^[A-Z]{3}$'),
    CONSTRAINT "income_expense_entries_description_not_blank_check" CHECK (btrim("description") <> ''),
    CONSTRAINT "income_expense_entries_vendor_only_for_expense_check" CHECK (
        "entry_type" = 'EXPENSE' OR "vendor_id" IS NULL
    )
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "account_type" "BankAccountType" NOT NULL,
    "status" "BankAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "currency" CHAR(3) NOT NULL,
    "institution_name" VARCHAR(120),
    "account_last_four" VARCHAR(4),
    "opening_balance_minor_units" BIGINT NOT NULL DEFAULT 0,
    "opening_balance_date" DATE,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "bank_accounts_name_not_blank_check" CHECK (btrim("name") <> ''),
    CONSTRAINT "bank_accounts_currency_iso_code_check" CHECK ("currency" ~ '^[A-Z]{3}$'),
    CONSTRAINT "bank_accounts_last_four_digits_check" CHECK (
        "account_last_four" IS NULL OR "account_last_four" ~ '^[0-9]{4}$'
    )
);

-- CreateTable
CREATE TABLE "bank_transactions" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "bank_account_id" UUID NOT NULL,
    "external_id" VARCHAR(255),
    "amount_minor_units" BIGINT NOT NULL,
    "transaction_date" DATE NOT NULL,
    "description" VARCHAR(1000) NOT NULL,
    "reference" VARCHAR(100),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "bank_transactions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "bank_transactions_amount_not_zero_check" CHECK ("amount_minor_units" <> 0),
    CONSTRAINT "bank_transactions_description_not_blank_check" CHECK (btrim("description") <> ''),
    CONSTRAINT "bank_transactions_external_id_not_blank_check" CHECK (
        "external_id" IS NULL OR btrim("external_id") <> ''
    )
);

-- CreateTable
CREATE TABLE "reconciliations" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "bank_transaction_id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "status" "ReconciliationStatus" NOT NULL DEFAULT 'CONFIRMED',
    "match_type" "ReconciliationMatchType" NOT NULL,
    "confidence_basis_points" INTEGER,
    "reconciled_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reversed_at" TIMESTAMPTZ(3),
    "note" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "reconciliations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "reconciliations_status_timestamp_check" CHECK (
        ("status" = 'CONFIRMED' AND "reversed_at" IS NULL)
        OR (
            "status" = 'REVERSED'
            AND "reversed_at" IS NOT NULL
            AND "reversed_at" >= "reconciled_at"
        )
    ),
    CONSTRAINT "reconciliations_match_confidence_check" CHECK (
        ("match_type" = 'SUGGESTED' AND "confidence_basis_points" BETWEEN 0 AND 10000)
        OR ("match_type" = 'MANUAL' AND "confidence_basis_points" IS NULL)
    )
);

-- CreateIndex
CREATE INDEX "income_expense_entries_workspace_id_occurred_on_idx" ON "income_expense_entries"("workspace_id", "occurred_on");

-- CreateIndex
CREATE INDEX "income_expense_entries_workspace_id_type_occurred_on_idx" ON "income_expense_entries"("workspace_id", "entry_type", "occurred_on");

-- CreateIndex
CREATE INDEX "income_expense_entries_workspace_id_vendor_id_idx" ON "income_expense_entries"("workspace_id", "vendor_id");

-- CreateIndex
CREATE INDEX "bank_accounts_workspace_id_status_idx" ON "bank_accounts"("workspace_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "bank_accounts_workspace_id_id_key" ON "bank_accounts"("workspace_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "bank_accounts_workspace_id_name_key" ON "bank_accounts"("workspace_id", "name");

-- CreateIndex
CREATE INDEX "bank_transactions_workspace_id_transaction_date_idx" ON "bank_transactions"("workspace_id", "transaction_date");

-- CreateIndex
CREATE INDEX "bank_transactions_bank_account_id_transaction_date_idx" ON "bank_transactions"("bank_account_id", "transaction_date");

-- CreateIndex
CREATE UNIQUE INDEX "bank_transactions_workspace_id_id_key" ON "bank_transactions"("workspace_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "bank_transactions_bank_account_id_external_id_key" ON "bank_transactions"("bank_account_id", "external_id") WHERE "external_id" IS NOT NULL;

-- CreateIndex
CREATE INDEX "reconciliations_workspace_id_status_reconciled_at_idx" ON "reconciliations"("workspace_id", "status", "reconciled_at");

-- CreateIndex
CREATE UNIQUE INDEX "reconciliations_confirmed_bank_transaction_id_key" ON "reconciliations"("bank_transaction_id") WHERE "status" = 'CONFIRMED';

-- CreateIndex
CREATE UNIQUE INDEX "reconciliations_confirmed_payment_id_key" ON "reconciliations"("payment_id") WHERE "status" = 'CONFIRMED';

-- CreateIndex
CREATE UNIQUE INDEX "payments_workspace_id_id_key" ON "payments"("workspace_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_workspace_id_id_key" ON "vendors"("workspace_id", "id");

-- AddForeignKey
ALTER TABLE "income_expense_entries" ADD CONSTRAINT "income_expense_entries_workspace_id_vendor_id_fkey" FOREIGN KEY ("workspace_id", "vendor_id") REFERENCES "vendors"("workspace_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income_expense_entries" ADD CONSTRAINT "income_expense_entries_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_workspace_id_bank_account_id_fkey" FOREIGN KEY ("workspace_id", "bank_account_id") REFERENCES "bank_accounts"("workspace_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_workspace_id_bank_transaction_id_fkey" FOREIGN KEY ("workspace_id", "bank_transaction_id") REFERENCES "bank_transactions"("workspace_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_workspace_id_payment_id_fkey" FOREIGN KEY ("workspace_id", "payment_id") REFERENCES "payments"("workspace_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
