import { forwardAuthJsonRequest } from "@/lib/auth/auth-proxy";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest): Promise<Response> {
  return forwardAuthJsonRequest(request, "/api/v1/auth/login");
}
