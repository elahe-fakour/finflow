import "server-only";

import { getApiUrl } from "@/lib/auth/api-url";
import { sessionCookieName } from "@/lib/auth/session-cookie";
import { cookies } from "next/headers";

type CashFlowReport = {
  basis: "CASH";
  currency: "USD";
  from: string;
  inflowsMinorUnits: string;
  months: {
    inflowsMinorUnits: string;
    month: string;
    netMinorUnits: string;
    outflowsMinorUnits: string;
  }[];
  netCashFlowMinorUnits: string;
  outflowsMinorUnits: string;
  to: string;
};

async function getCashFlowReport(
  workspaceId: string,
  from: string,
  to: string,
): Promise<CashFlowReport | null> {
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
        `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/reports/cash-flow?${query.toString()}`,
      ),
      { cache: "no-store", headers },
    );

    if (!response.ok) return null;
    return (await response.json()) as CashFlowReport;
  } catch {
    return null;
  }
}

export { getCashFlowReport };
export type { CashFlowReport };
