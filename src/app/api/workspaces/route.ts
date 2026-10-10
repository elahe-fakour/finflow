import { forwardApiRequest } from "@/lib/api/api-proxy";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest): Promise<Response> {
  return forwardApiRequest(request, "/api/v1/workspaces", "POST");
}
