import "server-only";

import { getApiUrl } from "@/lib/auth/api-url";
import { sessionCookieName } from "@/lib/auth/session-cookie";
import { cookies } from "next/headers";

type IncomeExpenseCategoryType = "EXPENSE" | "INCOME";

type IncomeExpenseCategory = {
  id: string;
  name: string;
  type: IncomeExpenseCategoryType;
  createdAt: string;
  updatedAt: string;
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

export { getIncomeExpenseCategories };
export type { IncomeExpenseCategory, IncomeExpenseCategoryType };
