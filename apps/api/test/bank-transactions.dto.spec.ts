import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CreateBankTransactionDto } from "../src/bank-transactions/dto/create-bank-transaction.dto.js";
import { AssignBankTransactionCategoryDto } from "../src/bank-transactions/dto/assign-bank-transaction-category.dto.js";
import { ListBankTransactionsDto } from "../src/bank-transactions/dto/list-bank-transactions.dto.js";
import { describe, expect, it } from "vitest";

describe("bank transaction DTOs", () => {
  it("accepts a signed amount and normalizes optional text fields", async () => {
    const input = plainToInstance(CreateBankTransactionDto, {
      bankAccountId: "6efc89d9-c720-45f6-82cd-ee29e80314b5",
      amountMinorUnits: "-125050",
      description: "  Contractor payment  ",
      reference: "  ACH-4242  ",
      transactionDate: "2026-10-11",
    });

    await expect(validate(input)).resolves.toEqual([]);
    expect(input.description).toBe("Contractor payment");
    expect(input.reference).toBe("ACH-4242");
  });

  it("rejects a zero amount and a malformed transaction date", async () => {
    const input = plainToInstance(CreateBankTransactionDto, {
      bankAccountId: "6efc89d9-c720-45f6-82cd-ee29e80314b5",
      amountMinorUnits: "0",
      description: "Contractor payment",
      transactionDate: "2026-10-1",
    });

    const errors = await validate(input);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(["amountMinorUnits", "transactionDate"]),
    );
  });

  it("parses valid list filters and pagination values", async () => {
    const input = plainToInstance(ListBankTransactionsDto, {
      bankAccountId: "6efc89d9-c720-45f6-82cd-ee29e80314b5",
      direction: "OUTFLOW",
      from: "2026-10-01",
      page: "2",
      pageSize: "50",
      q: "  Stripe  ",
      to: "2026-10-11",
    });

    await expect(validate(input)).resolves.toEqual([]);
    expect(input).toMatchObject({ page: 2, pageSize: 50, q: "Stripe" });
  });

  it("accepts a category UUID or null when assigning a transaction category", async () => {
    const category = plainToInstance(AssignBankTransactionCategoryDto, {
      categoryId: "6efc89d9-c720-45f6-82cd-ee29e80314b7",
    });
    const uncategorized = plainToInstance(AssignBankTransactionCategoryDto, { categoryId: null });

    await expect(validate(category)).resolves.toEqual([]);
    await expect(validate(uncategorized)).resolves.toEqual([]);
  });
});
