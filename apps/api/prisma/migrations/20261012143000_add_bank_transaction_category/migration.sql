ALTER TABLE "bank_transactions"
ADD COLUMN "category_id" UUID;

ALTER TABLE "bank_transactions"
ADD CONSTRAINT "bank_transactions_workspace_id_category_id_fkey"
FOREIGN KEY ("workspace_id", "category_id")
REFERENCES "income_expense_categories"("workspace_id", "id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

CREATE INDEX "bank_transactions_workspace_id_category_id_idx"
ON "bank_transactions"("workspace_id", "category_id");
