import { describe, expect, it } from "vitest";
import { formatUsdMinorUnits } from "./format-minor-units";

describe("formatUsdMinorUnits", () => {
  it("formats integer minor units as USD without a floating-point conversion", () => {
    expect(formatUsdMinorUnits("125099")).toBe("$1,250.99");
  });

  it("preserves values that exceed JavaScript's safe Number range", () => {
    expect(formatUsdMinorUnits("9007199254740993")).toBe("$90,071,992,547,409.93");
  });

  it("rejects non-positive and non-integer inputs", () => {
    expect(() => formatUsdMinorUnits("0")).toThrow("positive integer string");
    expect(() => formatUsdMinorUnits("12.50")).toThrow("positive integer string");
  });
});
