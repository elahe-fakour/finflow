import "server-only";

import { getApiUrl } from "@/lib/auth/api-url";
import { sessionCookieName } from "@/lib/auth/session-cookie";
import { cookies } from "next/headers";

type CandidateEvidence = {
  code: "EXACT_AMOUNT" | "INVOICE_NUMBER" | "CUSTOMER_NAME" | "DATE_PROXIMITY";
  explanation: string;
  points: number;
};

type ScoredInvoiceCandidate = {
  classification: "HIGH" | "MEDIUM" | "LOW" | "NOT_SUGGESTED";
  dueDate: string;
  evidence: CandidateEvidence[];
  invoiceId: string;
  invoiceNumber: string;
  scoreBasisPoints: number;
};

type ReconciliationSuggestions = {
  bankTransaction: {
    amountMinorUnits: string;
    description: string;
    hasActiveReconciliation: boolean;
    id: string;
    reference: string | null;
    transactionDate: string;
  };
  suggestions: ScoredInvoiceCandidate[];
};

async function getReconciliationSuggestions(
  workspaceId: string,
  transactionId: string,
): Promise<ReconciliationSuggestions | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(sessionCookieName);
  const headers = new Headers();

  if (sessionCookie !== undefined) {
    headers.set("Cookie", `${sessionCookieName}=${sessionCookie.value}`);
  }

  try {
    const response = await fetch(
      getApiUrl(
        `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/bank-transactions/${encodeURIComponent(transactionId)}/reconciliation-suggestions`,
      ),
      { cache: "no-store", headers },
    );

    if (!response.ok) return null;
    return (await response.json()) as ReconciliationSuggestions;
  } catch {
    return null;
  }
}

export { getReconciliationSuggestions };
export type { CandidateEvidence, ReconciliationSuggestions, ScoredInvoiceCandidate };
