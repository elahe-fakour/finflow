ALTER TABLE "bank_transactions"
ADD COLUMN "idempotency_key" VARCHAR(255);

ALTER TABLE "bank_transactions"
ADD CONSTRAINT "bank_transactions_idempotency_key_not_blank_check"
CHECK ("idempotency_key" IS NULL OR btrim("idempotency_key") <> '');

CREATE UNIQUE INDEX "bank_transactions_workspace_id_idempotency_key_key"
ON "bank_transactions"("workspace_id", "idempotency_key");
