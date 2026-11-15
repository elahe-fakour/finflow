import "server-only";

import { getApiUrl } from "@/lib/auth/api-url";
import { sessionCookieName } from "@/lib/auth/session-cookie";
import { cookies } from "next/headers";

type CategoryBreakdown = {
  amountMinorUnits: string;
  categoryId: string | null;
  categoryName: string;
}[];

type CategoryBreakdownReport = {
  basis: "ACCRUAL";
  currency: "USD";
  expenses: {
    categories: CategoryBreakdown;
    totalMinorUnits: string;
  };
  from: string;
  manualIncome: {
    categories: CategoryBreakdown;
    totalMinorUnits: string;
  };
  to: string;
};

async function getCategoryBreakdownReport(
  workspaceId: string,
  from: string,
  to: string,
): Promise<CategoryBreakdownReport | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(sessionCookieName);
  const headers = new Headers();

  if (sessionCookie !== undefined) {
    headers.set("Cookie", `${sessionCookieName}=${sessionCookie.value}`);
  }

  const query = new URLSearchParams({ from, to });

  try {
    const response = await fetch(
      getApiUrl(
        `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/reports/category-breakdown?${query.toString()}`,
      ),
      { cache: "no-store", headers },
    );

    if (!response.ok) return null;
    return (await response.json()) as CategoryBreakdownReport;
  } catch {
    return null;
  }
}

export { getCategoryBreakdownReport };
export type { CategoryBreakdownReport };
