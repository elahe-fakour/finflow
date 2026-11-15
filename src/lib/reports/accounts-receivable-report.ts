import "server-only";

import { getApiUrl } from "@/lib/auth/api-url";
import { sessionCookieName } from "@/lib/auth/session-cookie";
import { cookies } from "next/headers";

type AccountsReceivableReport = {
  asOf: string;
  currency: "USD";
  invoices: {
    customerName: string;
    dueDate: string;
    invoiceId: string;
    invoiceNumber: string;
    issueDate: string;
    outstandingMinorUnits: string;
    paidMinorUnits: string;
    status: "CURRENT" | "OVERDUE";
    totalMinorUnits: string;
  }[];
  summary: {
    currentMinorUnits: string;
    currentInvoiceCount: number;
    overdueInvoiceCount: number;
    overdueMinorUnits: string;
    totalOutstandingMinorUnits: string;
  };
};

async function getAccountsReceivableReport(
  workspaceId: string,
  asOf: string,
): Promise<AccountsReceivableReport | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(sessionCookieName);
  const headers = new Headers();

  if (sessionCookie !== undefined) {
    headers.set("Cookie", `${sessionCookieName}=${sessionCookie.value}`);
  }

  const query = new URLSearchParams({ asOf });

  try {
    const response = await fetch(
      getApiUrl(
        `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/reports/accounts-receivable?${query.toString()}`,
      ),
      { cache: "no-store", headers },
    );

    if (!response.ok) return null;
    return (await response.json()) as AccountsReceivableReport;
  } catch {
    return null;
  }
}

export { getAccountsReceivableReport };
export type { AccountsReceivableReport };
