import "server-only";

import { getApiUrl } from "@/lib/auth/api-url";
import { sessionCookieName } from "@/lib/auth/session-cookie";
import type { BankTransactionListFilters } from "@/lib/bank-transactions/bank-transaction-filters";
import { cookies } from "next/headers";

type BankTransaction = {
  amountMinorUnits: string;
  bankAccount: {
    currency: "USD";
    id: string;
    name: string;
  };
  bankAccountId: string;
  createdAt: string;
  description: string;
  id: string;
  reference: string | null;
  transactionDate: string;
  updatedAt: string;
};

type PaginatedBankTransactions = {
  data: BankTransaction[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

async function getBankTransactions(
  workspaceId: string,
  filters: BankTransactionListFilters,
): Promise<PaginatedBankTransactions | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(sessionCookieName);
  const headers = new Headers();
  const query = new URLSearchParams({
    page: String(filters.page),
    pageSize: String(filters.pageSize),
  });

  if (sessionCookie !== undefined) {
    headers.set("Cookie", `${sessionCookieName}=${sessionCookie.value}`);
  }

  if (filters.q !== undefined) {
    query.set("q", filters.q);
  }

  if (filters.bankAccountId !== undefined) {
    query.set("bankAccountId", filters.bankAccountId);
  }

  if (filters.direction !== undefined) {
    query.set("direction", filters.direction);
  }

  if (filters.from !== undefined) {
    query.set("from", filters.from);
  }

  if (filters.to !== undefined) {
    query.set("to", filters.to);
  }

  try {
    const response = await fetch(
      getApiUrl(
        `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/bank-transactions?${query.toString()}`,
      ),
      { cache: "no-store", headers },
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as PaginatedBankTransactions;
  } catch {
    return null;
  }
}

export { getBankTransactions };
export type { BankTransaction, PaginatedBankTransactions };
