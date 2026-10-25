import { forwardApiRequest } from "@/lib/api/api-proxy";
import type { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ workspaceId: string; invitationId: string }> };

export async function POST(request: NextRequest, { params }: RouteContext): Promise<Response> {
  const { workspaceId, invitationId } = await params;
  return forwardApiRequest(
    request,
    `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/invitations/${encodeURIComponent(invitationId)}/revoke`,
    "POST",
  );
}
