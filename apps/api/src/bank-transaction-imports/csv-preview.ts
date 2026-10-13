import { createHash } from "node:crypto";

export type CsvPreviewRow = {
  amountMinorUnits: string | null;
  description: string | null;
  errors: { code: string; message: string }[];
  externalId: string | null;
  reference: string | null;
  rowNumber: number;
  status: "DUPLICATE" | "ERROR" | "VALID";
  transactionDate: string | null;
};

const requiredHeaders = ["transactionDate", "description", "amount"] as const;
const maxMinorUnits = 9_223_372_036_854_775_807n;

export function createCsvPreview(content: string): CsvPreviewRow[] {
  const records = parseCsv(content.replace(/^\uFEFF/u, ""));

  if (records.length === 0) {
    throw new CsvPreviewError("CSV_INVALID_ROW_STRUCTURE", "The CSV file is empty.");
  }

  const headers = records[0].map((value) => value.trim());
  const headerIndexes = new Map(headers.map((header, index) => [header, index]));
  const missingHeader = requiredHeaders.find((header) => !headerIndexes.has(header));

  if (missingHeader !== undefined) {
    throw new CsvPreviewError(
      "CSV_REQUIRED_HEADER_MISSING",
      `The CSV file must include the ${missingHeader} header.`,
    );
  }

  const fingerprints = new Set<string>();

  return records.slice(1).flatMap((record, index) => {
    if (record.every((value) => value.trim() === "")) {
      return [];
    }

    const row = previewRow(record, index + 2, headerIndexes);

    if (row.errors.length === 0) {
      const fingerprint = createPreviewFingerprint(row);

      if (fingerprints.has(fingerprint)) {
        row.errors.push({
          code: "CSV_DUPLICATE_WITHIN_FILE",
          message: "This row duplicates another transaction in the uploaded file.",
        });
      }

      fingerprints.add(fingerprint);
    }

    return [{ ...row, status: row.errors.length === 0 ? "VALID" : "ERROR" }];
  });
}

function previewRow(
  record: string[],
  rowNumber: number,
  headerIndexes: Map<string, number>,
): Omit<CsvPreviewRow, "status"> {
  const errors: CsvPreviewRow["errors"] = [];
  const description = field(record, headerIndexes, "description");
  const reference = optionalField(
    record,
    headerIndexes,
    "reference",
    100,
    "CSV_REFERENCE_TOO_LONG",
    errors,
  );
  const transactionDate = parseDate(field(record, headerIndexes, "transactionDate"), errors);
  const amountMinorUnits = parseAmount(field(record, headerIndexes, "amount"), errors);

  if (description === "") {
    errors.push({ code: "CSV_DESCRIPTION_REQUIRED", message: "Description is required." });
  } else if (description.length > 1000) {
    errors.push({
      code: "CSV_INVALID_ROW_STRUCTURE",
      message: "Description exceeds 1,000 characters.",
    });
  }

  const externalId = optionalField(
    record,
    headerIndexes,
    "externalId",
    255,
    "CSV_EXTERNAL_ID_TOO_LONG",
    errors,
  );

  return {
    amountMinorUnits,
    description: description === "" ? null : description,
    errors,
    externalId,
    reference,
    rowNumber,
    transactionDate,
  };
}

function field(record: string[], indexes: Map<string, number>, name: string): string {
  return (record[indexes.get(name) ?? -1] ?? "").trim();
}

function optionalField(
  record: string[],
  indexes: Map<string, number>,
  name: string,
  maxLength: number,
  errorCode: string,
  errors: CsvPreviewRow["errors"],
): string | null {
  const value = field(record, indexes, name);

  if (value.length > maxLength) {
    errors.push({ code: errorCode, message: `${name} exceeds ${maxLength} characters.` });
  }

  return value === "" ? null : value;
}

function parseDate(value: string, errors: CsvPreviewRow["errors"]): string | null {
  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    !/^\d{4}-\d{2}-\d{2}$/u.test(value) ||
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    errors.push({
      code: "CSV_INVALID_TRANSACTION_DATE",
      message: "transactionDate must use YYYY-MM-DD.",
    });
    return null;
  }

  return value;
}

function parseAmount(value: string, errors: CsvPreviewRow["errors"]): string | null {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/u.exec(value);

  if (match === null) {
    errors.push({
      code: "CSV_INVALID_AMOUNT",
      message: "amount must be a signed decimal without separators.",
    });
    return null;
  }

  const [, sign, whole, fractionInput] = match;
  const amount = BigInt(whole) * 100n + BigInt((fractionInput ?? "").padEnd(2, "0"));

  if (amount === 0n) {
    errors.push({ code: "CSV_ZERO_AMOUNT", message: "amount must not be zero." });
    return null;
  }

  if (amount > maxMinorUnits) {
    errors.push({ code: "CSV_INVALID_AMOUNT", message: "amount exceeds the supported range." });
    return null;
  }

  return `${sign === "-" ? "-" : ""}${amount}`;
}

function createPreviewFingerprint(row: Omit<CsvPreviewRow, "status">): string {
  if (row.externalId !== null) {
    return createHash("sha256").update(`externalId\u0000${row.externalId}`).digest("hex");
  }

  return createHash("sha256")
    .update(
      `${row.transactionDate}\u0000${row.amountMinorUnits}\u0000${row.description}\u0000${row.reference ?? ""}`,
    )
    .digest("hex");
}

export function createImportSourceFingerprint(
  bankAccountId: string,
  row: Pick<
    CsvPreviewRow,
    "amountMinorUnits" | "description" | "externalId" | "reference" | "transactionDate"
  >,
): string {
  const source =
    row.externalId === null
      ? `${bankAccountId}\u0000${row.transactionDate}\u0000${row.amountMinorUnits}\u0000${row.description}\u0000${row.reference ?? ""}`
      : `${bankAccountId}\u0000externalId\u0000${row.externalId}`;

  return createHash("sha256").update(source).digest("hex");
}

function parseCsv(content: string): string[][] {
  const records: string[][] = [];
  let fieldValue = "";
  let record: string[] = [];
  let quoted = false;

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];

    if (character === '"') {
      if (quoted && content[index + 1] === '"') {
        fieldValue += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      record.push(fieldValue);
      fieldValue = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && content[index + 1] === "\n") index += 1;
      record.push(fieldValue);
      records.push(record);
      fieldValue = "";
      record = [];
    } else {
      fieldValue += character;
    }
  }

  if (quoted)
    throw new CsvPreviewError(
      "CSV_INVALID_ROW_STRUCTURE",
      "The CSV contains an unclosed quoted value.",
    );
  if (fieldValue !== "" || record.length > 0) records.push([...record, fieldValue]);
  return records;
}

export class CsvPreviewError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
