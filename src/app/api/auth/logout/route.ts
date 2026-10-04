import { forwardLogoutRequest } from "@/lib/auth/auth-proxy";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest): Promise<Response> {
  return forwardLogoutRequest(request);
}
