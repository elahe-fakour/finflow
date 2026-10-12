import { parseUsdToMinorUnits } from "@/lib/money/parse-usd-minor-units";

type BankTransactionDirection = "INFLOW" | "OUTFLOW";

type CreateBankTransactionValues = {
  amount: string;
  bankAccountId: string;
  description: string;
  direction: BankTransactionDirection;
  reference: string;
  transactionDate: string;
};

type CreateBankTransactionPayload = {
  amountMinorUnits: string;
  bankAccountId: string;
  description: string;
  reference?: string;
  transactionDate: string;
};

function createBankTransactionPayload(
  values: CreateBankTransactionValues,
): CreateBankTransactionPayload {
  const absoluteMinorUnits = parseUsdToMinorUnits(values.amount);

  return {
    amountMinorUnits:
      values.direction === "OUTFLOW" ? `-${absoluteMinorUnits}` : absoluteMinorUnits,
    bankAccountId: values.bankAccountId,
    description: values.description.trim(),
    ...(values.reference.trim() === "" ? {} : { reference: values.reference.trim() }),
    transactionDate: values.transactionDate,
  };
}

export { createBankTransactionPayload };
export type { BankTransactionDirection, CreateBankTransactionValues };
