import { describe, expect, it } from "vitest";
import { formatUsdMinorUnits } from "./format-minor-units";

describe("formatUsdMinorUnits", () => {
  it("formats integer minor units as USD without a floating-point conversion", () => {
    expect(formatUsdMinorUnits("125099")).toBe("$1,250.99");
  });

  it("preserves values that exceed JavaScript's safe Number range", () => {
    expect(formatUsdMinorUnits("9007199254740993")).toBe("$90,071,992,547,409.93");
  });

  it("formats zero and negative values without a floating-point conversion", () => {
    expect(formatUsdMinorUnits("0")).toBe("$0.00");
    expect(formatUsdMinorUnits("-1250")).toBe("-$12.50");
  });

  it("rejects decimal and malformed integer inputs", () => {
    expect(() => formatUsdMinorUnits("12.50")).toThrow("integer string");
    expect(() => formatUsdMinorUnits("-0")).toThrow("integer string");
  });
});
