import "server-only";

import { getApiUrl } from "@/lib/auth/api-url";
import { sessionCookieName } from "@/lib/auth/session-cookie";
import { cookies } from "next/headers";
import type { EntryListFilters } from "./entry-list-filters";

type IncomeExpenseCategoryType = "EXPENSE" | "INCOME";

type IncomeExpenseCategory = {
  id: string;
  name: string;
  type: IncomeExpenseCategoryType;
  createdAt: string;
  updatedAt: string;
};

type IncomeExpenseEntry = {
  amountMinorUnits: string;
  category: {
    id: string;
    name: string;
    type: IncomeExpenseCategoryType;
  };
  createdAt: string;
  currency: "USD";
  description: string;
  id: string;
  occurredOn: string;
  reference: string | null;
  type: IncomeExpenseCategoryType;
  updatedAt: string;
  vendor: { id: string; name: string } | null;
};

type PaginatedIncomeExpenseEntries = {
  data: IncomeExpenseEntry[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

type VendorOption = {
  id: string;
  name: string;
};

async function getIncomeExpenseCategories(
  workspaceId: string,
): Promise<IncomeExpenseCategory[] | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(sessionCookieName);
  const headers = new Headers();

  if (sessionCookie !== undefined) {
    headers.set("Cookie", `${sessionCookieName}=${sessionCookie.value}`);
  }

  try {
    const response = await fetch(
      getApiUrl(`/api/v1/workspaces/${encodeURIComponent(workspaceId)}/income-expense-categories`),
      {
        cache: "no-store",
        headers,
      },
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as IncomeExpenseCategory[];
  } catch {
    return null;
  }
}

async function getIncomeExpenseEntries(
  workspaceId: string,
  filters: EntryListFilters,
): Promise<PaginatedIncomeExpenseEntries | null> {
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

  if (filters.type !== undefined) {
    query.set("type", filters.type);
  }

  if (filters.categoryId !== undefined) {
    query.set("categoryId", filters.categoryId);
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
        `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/income-expense-entries?${query.toString()}`,
      ),
      { cache: "no-store", headers },
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as PaginatedIncomeExpenseEntries;
  } catch {
    return null;
  }
}

async function getVendorOptions(workspaceId: string): Promise<VendorOption[] | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(sessionCookieName);
  const headers = new Headers();

  if (sessionCookie !== undefined) {
    headers.set("Cookie", `${sessionCookieName}=${sessionCookie.value}`);
  }

  try {
    const response = await fetch(
      getApiUrl(`/api/v1/workspaces/${encodeURIComponent(workspaceId)}/vendors`),
      { cache: "no-store", headers },
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as VendorOption[];
  } catch {
    return null;
  }
}

export { getIncomeExpenseCategories, getIncomeExpenseEntries, getVendorOptions };
export type {
  IncomeExpenseCategory,
  IncomeExpenseCategoryType,
  IncomeExpenseEntry,
  PaginatedIncomeExpenseEntries,
  VendorOption,
};
