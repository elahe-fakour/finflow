import { forwardApiRequest } from "@/lib/api/api-proxy";
import type { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ token: string }> };

export async function POST(request: NextRequest, { params }: RouteContext): Promise<Response> {
  const { token } = await params;

  return forwardApiRequest(
    request,
    `/api/v1/workspaces/invitations/${encodeURIComponent(token)}/accept`,
    "POST",
  );
}
