import "server-only";

import { getApiUrl } from "@/lib/auth/api-url";
import { sessionCookieName } from "@/lib/auth/session-cookie";
import { cookies } from "next/headers";

type ProfitLossReport = {
  basis: "ACCRUAL";
  currency: "USD";
  expenses: {
    manualExpenseMinorUnits: string;
    totalMinorUnits: string;
  };
  from: string;
  income: {
    invoiceRevenueMinorUnits: string;
    manualIncomeMinorUnits: string;
    totalMinorUnits: string;
  };
  netProfitMinorUnits: string;
  to: string;
};

async function getProfitLossReport(
  workspaceId: string,
  from: string,
  to: string,
): Promise<ProfitLossReport | null> {
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
        `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/reports/profit-loss?${query.toString()}`,
      ),
      { cache: "no-store", headers },
    );

    if (!response.ok) return null;
    return (await response.json()) as ProfitLossReport;
  } catch {
    return null;
  }
}

export { getProfitLossReport };
export type { ProfitLossReport };
