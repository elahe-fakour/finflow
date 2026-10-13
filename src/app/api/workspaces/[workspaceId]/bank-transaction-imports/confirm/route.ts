import { forwardApiRequest } from "@/lib/api/api-proxy";
import type { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ workspaceId: string }> };

export async function POST(request: NextRequest, { params }: RouteContext): Promise<Response> {
  const { workspaceId } = await params;
  return forwardApiRequest(
    request,
    `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/bank-transaction-imports/confirm`,
    "POST",
  );
}
