import { describe, expect, it } from "vitest";
import { createBankTransactionPayload } from "./create-bank-transaction";

describe("createBankTransactionPayload", () => {
  it("converts a positive inflow amount into integer minor units", () => {
    expect(
      createBankTransactionPayload({
        amount: "1250.50",
        bankAccountId: "account-1",
        description: "  Stripe payment ",
        direction: "INFLOW",
        reference: "  pi_123 ",
        transactionDate: "2026-10-12",
      }),
    ).toEqual({
      amountMinorUnits: "125050",
      bankAccountId: "account-1",
      description: "Stripe payment",
      reference: "pi_123",
      transactionDate: "2026-10-12",
    });
  });

  it("stores an outflow as a negative integer and omits an empty reference", () => {
    expect(
      createBankTransactionPayload({
        amount: "88",
        bankAccountId: "account-1",
        description: "Software subscription",
        direction: "OUTFLOW",
        reference: "   ",
        transactionDate: "2026-10-12",
      }),
    ).toEqual({
      amountMinorUnits: "-8800",
      bankAccountId: "account-1",
      description: "Software subscription",
      transactionDate: "2026-10-12",
    });
  });
});
