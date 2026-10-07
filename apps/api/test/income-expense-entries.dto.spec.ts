import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { IncomeExpenseType } from "../src/generated/prisma/client.js";
import { CreateIncomeExpenseEntryDto } from "../src/income-expense-entries/dto/create-income-expense-entry.dto.js";
import { ListIncomeExpenseEntriesDto } from "../src/income-expense-entries/dto/list-income-expense-entries.dto.js";
import { describe, expect, it } from "vitest";

describe("income and expense entry DTOs", () => {
  it("accepts a precise minor-unit string and trims text fields", async () => {
    const input = plainToInstance(CreateIncomeExpenseEntryDto, {
      type: IncomeExpenseType.EXPENSE,
      amountMinorUnits: "1250",
      currency: "USD",
      occurredOn: "2026-10-07",
      description: "  Annual software subscription  ",
      categoryId: "6efc89d9-c720-45f6-82cd-ee29e80314b5",
      reference: "  INV-42  ",
    });

    await expect(validate(input)).resolves.toEqual([]);
    expect(input.description).toBe("Annual software subscription");
    expect(input.reference).toBe("INV-42");
  });

  it("rejects decimal money input and unsupported currency", async () => {
    const input = plainToInstance(CreateIncomeExpenseEntryDto, {
      type: IncomeExpenseType.INCOME,
      amountMinorUnits: "12.50",
      currency: "EUR",
      occurredOn: "2026-10-07",
      description: "Consulting work",
      categoryId: "6efc89d9-c720-45f6-82cd-ee29e80314b5",
    });

    const errors = await validate(input);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(["amountMinorUnits", "currency"]),
    );
  });

  it("explicitly transforms valid pagination query strings", async () => {
    const input = plainToInstance(ListIncomeExpenseEntriesDto, {
      page: "2",
      pageSize: "50",
      from: "2026-10-01",
      to: "2026-10-07",
    });

    await expect(validate(input)).resolves.toEqual([]);
    expect(input.page).toBe(2);
    expect(input.pageSize).toBe(50);
  });
});
