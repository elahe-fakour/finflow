import { describe, expect, it } from "vitest";
import {
  createCsvPreview,
  createImportSourceFingerprint,
  CsvPreviewError,
} from "../src/bank-transaction-imports/csv-preview.js";

describe("createCsvPreview", () => {
  it("normalizes signed amounts and reports invalid rows without persistence", () => {
    const rows = createCsvPreview(
      `transactionDate,description,amount,reference\n2026-10-12,Stripe payout,1250.50,payout-1\n2026-10-13,,0,`,
    );

    expect(rows).toEqual([
      expect.objectContaining({ amountMinorUnits: "125050", rowNumber: 2, status: "VALID" }),
      expect.objectContaining({ rowNumber: 3, status: "ERROR" }),
    ]);
    expect(rows[1]?.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining(["CSV_DESCRIPTION_REQUIRED", "CSV_ZERO_AMOUNT"]),
    );
  });

  it("rejects a missing required header", () => {
    expect(() => createCsvPreview("description,amount\nStripe,12.00")).toThrow(CsvPreviewError);
    expect(() => createCsvPreview("description,amount\nStripe,12.00")).toThrow(
      "transactionDate header",
    );
  });

  it("uses a bank account and external ID to produce a stable import fingerprint", () => {
    const [row] = createCsvPreview(
      "transactionDate,description,amount,externalId\n2026-10-12,Stripe payout,1250.50,payout-1",
    );

    expect(row).toMatchObject({ externalId: "payout-1", status: "VALID" });
    expect(createImportSourceFingerprint("account-a", row!)).toEqual(
      createImportSourceFingerprint("account-a", row!),
    );
    expect(createImportSourceFingerprint("account-a", row!)).not.toEqual(
      createImportSourceFingerprint("account-b", row!),
    );
  });
});
