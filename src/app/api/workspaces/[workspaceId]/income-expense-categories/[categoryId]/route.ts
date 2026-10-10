import { forwardApiRequest } from "@/lib/api/api-proxy";
import type { NextRequest } from "next/server";

type RouteContext = {
  params: Promise<{ categoryId: string; workspaceId: string }>;
};

export async function PATCH(request: NextRequest, { params }: RouteContext): Promise<Response> {
  const { categoryId, workspaceId } = await params;

  return forwardApiRequest(
    request,
    `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/income-expense-categories/${encodeURIComponent(categoryId)}`,
    "PATCH",
  );
}

export async function DELETE(request: NextRequest, { params }: RouteContext): Promise<Response> {
  const { categoryId, workspaceId } = await params;

  return forwardApiRequest(
    request,
    `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/income-expense-categories/${encodeURIComponent(categoryId)}`,
    "DELETE",
  );
}
