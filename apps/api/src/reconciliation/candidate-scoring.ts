const SUGGESTION_THRESHOLD = 6_500;
const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/u;

type CandidateTransaction = {
  workspaceId: string;
  bankAccountCurrency: string;
  amountMinorUnits: bigint;
  transactionDate: string;
  description: string;
  reference: string | null;
  hasActiveReconciliation: boolean;
};

type CandidateInvoice = {
  id: string;
  workspaceId: string;
  currency: string;
  invoiceNumber: string;
  customerName: string;
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";
  outstandingMinorUnits: bigint;
  dueDate: string;
};

type CandidateEvidenceCode = "EXACT_AMOUNT" | "INVOICE_NUMBER" | "CUSTOMER_NAME" | "DATE_PROXIMITY";

type CandidateEvidence = {
  code: CandidateEvidenceCode;
  points: number;
  explanation: string;
};

type CandidateClassification = "HIGH" | "MEDIUM" | "LOW" | "NOT_SUGGESTED";

type ScoredInvoiceCandidate = {
  invoiceId: string;
  invoiceNumber: string;
  dueDate: string;
  scoreBasisPoints: number;
  classification: CandidateClassification;
  evidence: CandidateEvidence[];
};

function scoreInvoiceCandidate(
  transaction: CandidateTransaction,
  invoice: CandidateInvoice,
): ScoredInvoiceCandidate | null {
  assertDateOnly(transaction.transactionDate, "Transaction date");
  assertDateOnly(invoice.dueDate, "Invoice due date");

  if (!isEligibleCandidate(transaction, invoice)) return null;

  const evidence: CandidateEvidence[] = [
    {
      code: "EXACT_AMOUNT",
      points: 6_000,
      explanation: "The invoice outstanding amount exactly matches the bank transaction amount.",
    },
  ];

  if (containsNormalizedPhrase(transactionText(transaction), invoice.invoiceNumber)) {
    evidence.push({
      code: "INVOICE_NUMBER",
      points: 2_500,
      explanation: "The invoice number appears in the transaction description or reference.",
    });
  }

  if (containsNormalizedPhrase(transactionText(transaction), invoice.customerName)) {
    evidence.push({
      code: "CUSTOMER_NAME",
      points: 800,
      explanation: "The customer name appears in the transaction description or reference.",
    });
  }

  const datePoints = scoreDateProximity(transaction.transactionDate, invoice.dueDate);

  if (datePoints > 0) {
    evidence.push({
      code: "DATE_PROXIMITY",
      points: datePoints,
      explanation: `The transaction date is within ${datePoints === 700 ? "three" : datePoints === 300 ? "seven" : "fourteen"} days of the invoice due date.`,
    });
  }

  const scoreBasisPoints = evidence.reduce((total, item) => total + item.points, 0);

  return {
    classification: classifyScore(scoreBasisPoints),
    dueDate: invoice.dueDate,
    evidence,
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    scoreBasisPoints,
  };
}

function rankInvoiceCandidates(
  transaction: CandidateTransaction,
  invoices: readonly CandidateInvoice[],
): ScoredInvoiceCandidate[] {
  return invoices
    .map((invoice) => scoreInvoiceCandidate(transaction, invoice))
    .filter((candidate): candidate is ScoredInvoiceCandidate => candidate !== null)
    .filter((candidate) => candidate.scoreBasisPoints >= SUGGESTION_THRESHOLD)
    .sort(
      (left, right) =>
        right.scoreBasisPoints - left.scoreBasisPoints ||
        left.dueDate.localeCompare(right.dueDate) ||
        left.invoiceNumber.localeCompare(right.invoiceNumber) ||
        left.invoiceId.localeCompare(right.invoiceId),
    );
}

function isEligibleCandidate(
  transaction: CandidateTransaction,
  invoice: CandidateInvoice,
): boolean {
  return (
    transaction.amountMinorUnits > 0n &&
    !transaction.hasActiveReconciliation &&
    transaction.workspaceId === invoice.workspaceId &&
    transaction.bankAccountCurrency === invoice.currency &&
    (invoice.status === "SENT" || invoice.status === "OVERDUE") &&
    invoice.outstandingMinorUnits > 0n &&
    transaction.amountMinorUnits === invoice.outstandingMinorUnits
  );
}

function transactionText(transaction: CandidateTransaction): string {
  return `${transaction.description} ${transaction.reference ?? ""}`;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFKC")
    .toUpperCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/gu, " ");
}

function containsNormalizedPhrase(source: string, phrase: string): boolean {
  const sourceTokens = normalizeText(source).split(" ").filter(Boolean);
  const phraseTokens = normalizeText(phrase).split(" ").filter(Boolean);

  if (phraseTokens.length === 0 || phraseTokens.length > sourceTokens.length) return false;

  return sourceTokens.some((_, index) =>
    phraseTokens.every((token, phraseIndex) => sourceTokens[index + phraseIndex] === token),
  );
}

function scoreDateProximity(transactionDate: string, dueDate: string): number {
  const differenceInDays = Math.abs(
    (dateToUtcMilliseconds(transactionDate) - dateToUtcMilliseconds(dueDate)) / 86_400_000,
  );

  if (differenceInDays <= 3) return 700;
  if (differenceInDays <= 7) return 300;
  if (differenceInDays <= 14) return 100;
  return 0;
}

function classifyScore(scoreBasisPoints: number): CandidateClassification {
  if (scoreBasisPoints >= 9_000) return "HIGH";
  if (scoreBasisPoints >= 7_500) return "MEDIUM";
  if (scoreBasisPoints >= SUGGESTION_THRESHOLD) return "LOW";
  return "NOT_SUGGESTED";
}

function assertDateOnly(value: string, label: string): void {
  const match = dateOnlyPattern.exec(value);

  if (match === null) throw new TypeError(`${label} must use YYYY-MM-DD format.`);

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== Number(match[1]) ||
    date.getUTCMonth() !== Number(match[2]) - 1 ||
    date.getUTCDate() !== Number(match[3])
  ) {
    throw new RangeError(`${label} must be a valid calendar date.`);
  }
}

function dateToUtcMilliseconds(value: string): number {
  return new Date(`${value}T00:00:00.000Z`).getTime();
}

export {
  classifyScore,
  containsNormalizedPhrase,
  normalizeText,
  rankInvoiceCandidates,
  scoreDateProximity,
  scoreInvoiceCandidate,
  type CandidateClassification,
  type CandidateEvidence,
  type CandidateEvidenceCode,
  type CandidateInvoice,
  type CandidateTransaction,
  type ScoredInvoiceCandidate,
};
