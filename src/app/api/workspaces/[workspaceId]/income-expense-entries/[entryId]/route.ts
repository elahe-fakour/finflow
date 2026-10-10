import { forwardApiRequest } from "@/lib/api/api-proxy";
import type { NextRequest } from "next/server";

type RouteContext = {
  params: Promise<{ entryId: string; workspaceId: string }>;
};

export async function PATCH(request: NextRequest, { params }: RouteContext): Promise<Response> {
  const { entryId, workspaceId } = await params;

  return forwardApiRequest(
    request,
    `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/income-expense-entries/${encodeURIComponent(entryId)}`,
    "PATCH",
  );
}
