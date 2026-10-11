import "server-only";

import { getApiUrl } from "@/lib/auth/api-url";
import { sessionCookieName } from "@/lib/auth/session-cookie";
import { cookies } from "next/headers";

type BankAccountStatus = "ACTIVE" | "ARCHIVED";
type BankAccountType = "CASH" | "CHECKING" | "OTHER" | "PAYMENT_PROCESSOR" | "SAVINGS";

type BankAccount = {
  accountLastFour: string | null;
  createdAt: string;
  currency: "USD";
  id: string;
  institutionName: string | null;
  name: string;
  openingBalanceDate: string | null;
  openingBalanceMinorUnits: string;
  status: BankAccountStatus;
  type: BankAccountType;
  updatedAt: string;
};

async function getBankAccounts(workspaceId: string): Promise<BankAccount[] | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(sessionCookieName);
  const headers = new Headers();

  if (sessionCookie !== undefined) {
    headers.set("Cookie", `${sessionCookieName}=${sessionCookie.value}`);
  }

  try {
    const response = await fetch(
      getApiUrl(`/api/v1/workspaces/${encodeURIComponent(workspaceId)}/bank-accounts`),
      { cache: "no-store", headers },
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as BankAccount[];
  } catch {
    return null;
  }
}

export { getBankAccounts };
export type { BankAccount, BankAccountStatus, BankAccountType };
