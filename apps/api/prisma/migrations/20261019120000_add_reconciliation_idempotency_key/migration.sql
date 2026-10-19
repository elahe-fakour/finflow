ALTER TABLE "reconciliations"
ADD COLUMN "idempotency_key" VARCHAR(255);

UPDATE "reconciliations"
SET "idempotency_key" = md5("id"::text || clock_timestamp()::text)
WHERE "idempotency_key" IS NULL;

ALTER TABLE "reconciliations"
ALTER COLUMN "idempotency_key" SET NOT NULL;

ALTER TABLE "reconciliations"
ADD CONSTRAINT "reconciliations_idempotency_key_not_blank_check"
CHECK (btrim("idempotency_key") <> '');

CREATE UNIQUE INDEX "reconciliations_workspace_idempotency_key_key"
ON "reconciliations"("workspace_id", "idempotency_key");
