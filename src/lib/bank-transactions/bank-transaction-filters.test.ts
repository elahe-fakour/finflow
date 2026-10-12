import { describe, expect, it } from "vitest";
import {
  createBankTransactionListPath,
  parseBankTransactionListFilters,
} from "./bank-transaction-filters";

describe("bank transaction list filters", () => {
  it("keeps valid URL filters and uses safe pagination defaults", () => {
    expect(
      parseBankTransactionListFilters({
        bankAccountId: "6efc89d9-c720-45f6-82cd-ee29e80314b5",
        direction: "OUTFLOW",
        from: "2026-10-01",
        page: "2",
        q: "  Stripe payment ",
        to: "2026-10-11",
      }),
    ).toEqual({
      bankAccountId: "6efc89d9-c720-45f6-82cd-ee29e80314b5",
      direction: "OUTFLOW",
      from: "2026-10-01",
      page: 2,
      pageSize: 25,
      q: "Stripe payment",
      to: "2026-10-11",
    });
  });

  it("drops invalid filter values before they reach the API", () => {
    expect(
      parseBankTransactionListFilters({
        bankAccountId: "not-a-uuid",
        direction: "BOTH",
        from: "2026-02-30",
        page: "-1",
        q: "",
        to: "2026-10-1",
      }),
    ).toEqual({ page: 1, pageSize: 25 });
  });

  it("creates a pagination path while preserving active filters", () => {
    expect(
      createBankTransactionListPath(
        {
          direction: "INFLOW",
          page: 1,
          pageSize: 25,
          q: "stripe",
        },
        3,
      ),
    ).toBe("/transactions?q=stripe&direction=INFLOW&page=3");
  });
});
