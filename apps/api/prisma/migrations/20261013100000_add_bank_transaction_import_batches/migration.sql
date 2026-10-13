CREATE TABLE "bank_transaction_import_batches" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "workspace_id" UUID NOT NULL,
  "bank_account_id" UUID NOT NULL,
  "imported_by_user_id" UUID NOT NULL,
  "idempotency_key" VARCHAR(255) NOT NULL,
  "file_name" VARCHAR(255) NOT NULL,
  "row_count" INTEGER NOT NULL,
  "imported_row_count" INTEGER NOT NULL,
  "imported_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "bank_transaction_import_batches_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "bank_transaction_import_batches_row_count_check" CHECK ("row_count" > 0),
  CONSTRAINT "bank_transaction_import_batches_imported_row_count_check"
    CHECK ("imported_row_count" > 0 AND "imported_row_count" <= "row_count"),
  CONSTRAINT "bank_transaction_import_batches_idempotency_key_not_blank_check"
    CHECK (btrim("idempotency_key") <> '')
);

ALTER TABLE "bank_transaction_import_batches"
ADD CONSTRAINT "bank_transaction_import_batches_workspace_id_bank_account_id_fkey"
FOREIGN KEY ("workspace_id", "bank_account_id")
REFERENCES "bank_accounts"("workspace_id", "id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "bank_transaction_import_batches"
ADD CONSTRAINT "bank_transaction_import_batches_imported_by_user_id_fkey"
FOREIGN KEY ("imported_by_user_id")
REFERENCES "users"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

CREATE UNIQUE INDEX "bank_transaction_import_batches_workspace_id_id_key"
ON "bank_transaction_import_batches"("workspace_id", "id");

CREATE UNIQUE INDEX "bank_tx_import_batches_workspace_idempotency_key_key"
ON "bank_transaction_import_batches"("workspace_id", "idempotency_key");

CREATE INDEX "bank_tx_import_batches_workspace_account_imported_at_idx"
ON "bank_transaction_import_batches"("workspace_id", "bank_account_id", "imported_at");

ALTER TABLE "bank_transactions"
ADD COLUMN "import_batch_id" UUID,
ADD COLUMN "import_source_fingerprint" CHAR(64);

ALTER TABLE "bank_transactions"
ADD CONSTRAINT "bank_transactions_workspace_id_import_batch_id_fkey"
FOREIGN KEY ("workspace_id", "import_batch_id")
REFERENCES "bank_transaction_import_batches"("workspace_id", "id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

CREATE UNIQUE INDEX "bank_transactions_workspace_account_fingerprint_key"
ON "bank_transactions"("workspace_id", "bank_account_id", "import_source_fingerprint");
