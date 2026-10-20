import { forwardApiRequest } from "@/lib/api/api-proxy";
import type { NextRequest } from "next/server";

type RouteContext = {
  params: Promise<{ bankTransactionId: string; workspaceId: string }>;
};

async function POST(request: NextRequest, context: RouteContext) {
  const { bankTransactionId, workspaceId } = await context.params;

  return forwardApiRequest(
    request,
    `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/bank-transactions/${encodeURIComponent(bankTransactionId)}/reconciliation-suggestions/confirm`,
    "POST",
  );
}

export { POST };
