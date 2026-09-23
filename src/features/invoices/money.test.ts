import { addMoney, createMoney, formatMoney, parseMoneyInput, subtractMoney } from "./money";
import { describe, expect, it } from "vitest";

describe("money", () => {
  it("creates a money value from safe integer minor units", () => {
    expect(createMoney(1250, "USD")).toEqual({ amountMinorUnits: 1250, currency: "USD" });
  });

  it("rejects fractional minor units and invalid currency codes", () => {
    expect(() => createMoney(12.5, "USD")).toThrow("safe integer");
    expect(() => createMoney(1250, "usd")).toThrow("normalized three-letter ISO 4217 code");
  });

  it("parses decimal user input into minor units without floating-point arithmetic", () => {
    expect(parseMoneyInput("12.50", "USD")).toEqual(createMoney(1250, "USD"));
    expect(parseMoneyInput("12.5", "USD")).toEqual(createMoney(1250, "USD"));
    expect(() => parseMoneyInput("12.500", "USD")).toThrow("more than 2 decimal places");
    expect(() => parseMoneyInput("1,250.00", "USD")).toThrow("without separators");
  });

  it("formats money only at the display boundary", () => {
    expect(formatMoney(createMoney(1250, "USD"))).toBe("$12.50");
  });

  it("adds matching currencies without mutating either input", () => {
    const subtotal = createMoney(1200, "USD");
    const tax = createMoney(90, "USD");

    expect(addMoney(subtotal, tax)).toEqual({ amountMinorUnits: 1290, currency: "USD" });
    expect(subtotal).toEqual({ amountMinorUnits: 1200, currency: "USD" });
    expect(tax).toEqual({ amountMinorUnits: 90, currency: "USD" });
  });

  it("subtracts matching currencies and permits an explicit negative result", () => {
    expect(subtractMoney(createMoney(100, "USD"), createMoney(150, "USD"))).toEqual({
      amountMinorUnits: -50,
      currency: "USD",
    });
  });

  it("rejects different currencies and safe-integer overflow", () => {
    expect(() => addMoney(createMoney(100, "USD"), createMoney(100, "EUR"))).toThrow(
      "same currency",
    );
    expect(() =>
      addMoney(createMoney(Number.MAX_SAFE_INTEGER, "USD"), createMoney(1, "USD")),
    ).toThrow("safe-integer range");
  });
});
