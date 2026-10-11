import { forwardApiRequest } from "@/lib/api/api-proxy";
import type { NextRequest } from "next/server";

type RouteContext = {
  params: Promise<{ bankAccountId: string; workspaceId: string }>;
};

export async function PATCH(request: NextRequest, { params }: RouteContext): Promise<Response> {
  const { bankAccountId, workspaceId } = await params;

  return forwardApiRequest(
    request,
    `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/bank-accounts/${encodeURIComponent(bankAccountId)}`,
    "PATCH",
  );
}
