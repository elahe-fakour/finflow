-- CreateTable
CREATE TABLE "income_expense_categories" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "category_type" "IncomeExpenseType" NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "income_expense_categories_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "income_expense_categories_name_not_blank_check" CHECK (btrim("name") <> '')
);

-- AlterTable
ALTER TABLE "income_expense_entries" ADD COLUMN "category_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "income_expense_categories_workspace_id_id_key" ON "income_expense_categories"("workspace_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "income_expense_categories_workspace_id_type_name_key" ON "income_expense_categories"("workspace_id", "category_type", "name");

-- CreateIndex
CREATE INDEX "income_expense_categories_workspace_id_type_name_idx" ON "income_expense_categories"("workspace_id", "category_type", "name");

-- CreateIndex
CREATE INDEX "income_expense_entries_workspace_id_category_id_idx" ON "income_expense_entries"("workspace_id", "category_id");

-- AddForeignKey
ALTER TABLE "income_expense_categories" ADD CONSTRAINT "income_expense_categories_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income_expense_entries" ADD CONSTRAINT "income_expense_entries_workspace_id_category_id_fkey" FOREIGN KEY ("workspace_id", "category_id") REFERENCES "income_expense_categories"("workspace_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
