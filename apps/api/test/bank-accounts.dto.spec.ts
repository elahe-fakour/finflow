import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { BankAccountType } from "../src/generated/prisma/client.js";
import { CreateBankAccountDto } from "../src/bank-accounts/dto/create-bank-account.dto.js";
import { UpdateBankAccountDto } from "../src/bank-accounts/dto/update-bank-account.dto.js";
import { describe, expect, it } from "vitest";

describe("bank account DTOs", () => {
  it("accepts a signed opening balance and normalizes optional display fields", async () => {
    const input = plainToInstance(CreateBankAccountDto, {
      name: "  Operating account  ",
      type: BankAccountType.CHECKING,
      currency: "USD",
      institutionName: "  Acme Bank  ",
      accountLastFour: "1234",
      openingBalanceMinorUnits: "-500",
      openingBalanceDate: "2026-10-01",
    });

    await expect(validate(input)).resolves.toEqual([]);
    expect(input.name).toBe("Operating account");
    expect(input.institutionName).toBe("Acme Bank");
  });

  it("rejects a decimal opening balance and unsupported currency", async () => {
    const input = plainToInstance(CreateBankAccountDto, {
      name: "Operating account",
      type: BankAccountType.CHECKING,
      currency: "EUR",
      openingBalanceMinorUnits: "12.50",
    });

    const errors = await validate(input);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(["currency", "openingBalanceMinorUnits"]),
    );
  });

  it("allows an update to clear optional account display fields", async () => {
    const input = plainToInstance(UpdateBankAccountDto, {
      institutionName: "   ",
      accountLastFour: "",
    });

    await expect(validate(input)).resolves.toEqual([]);
    expect(input.institutionName).toBeNull();
    expect(input.accountLastFour).toBeNull();
  });
});
