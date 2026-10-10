import { describe, expect, it } from "vitest";
import { parseUsdToMinorUnits } from "./parse-usd-minor-units";

describe("parseUsdToMinorUnits", () => {
  it("converts whole and fractional USD values to integer minor unit strings", () => {
    expect(parseUsdToMinorUnits("1250")).toBe("125000");
    expect(parseUsdToMinorUnits("1250.5")).toBe("125050");
    expect(parseUsdToMinorUnits("1250.50")).toBe("125050");
  });

  it("does not round values beyond JavaScript's safe Number range", () => {
    expect(parseUsdToMinorUnits("90071992547409.93")).toBe("9007199254740993");
  });

  it("rejects zero, negative, and malformed values", () => {
    expect(() => parseUsdToMinorUnits("0")).toThrow("greater than zero");
    expect(() => parseUsdToMinorUnits("-1.00")).toThrow("positive USD amount");
    expect(() => parseUsdToMinorUnits("1,250.00")).toThrow("positive USD amount");
    expect(() => parseUsdToMinorUnits("12.345")).toThrow("positive USD amount");
  });
});
