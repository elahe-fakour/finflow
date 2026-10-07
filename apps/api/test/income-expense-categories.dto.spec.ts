import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { IncomeExpenseType } from "../src/generated/prisma/client.js";
import { CreateIncomeExpenseCategoryDto } from "../src/income-expense-categories/dto/create-income-expense-category.dto.js";
import { describe, expect, it } from "vitest";

describe("CreateIncomeExpenseCategoryDto", () => {
  it("trims a valid category name without coercing its type", async () => {
    const input = plainToInstance(CreateIncomeExpenseCategoryDto, {
      type: IncomeExpenseType.INCOME,
      name: "  Consulting revenue  ",
    });

    await expect(validate(input)).resolves.toEqual([]);
    expect(input).toEqual({
      type: IncomeExpenseType.INCOME,
      name: "Consulting revenue",
    });
  });

  it("rejects a blank name and an unsupported category type", async () => {
    const input = plainToInstance(CreateIncomeExpenseCategoryDto, {
      type: "TRANSFER",
      name: "   ",
    });

    const errors = await validate(input);

    expect(errors.map((error) => error.property)).toEqual(expect.arrayContaining(["type", "name"]));
  });
});
