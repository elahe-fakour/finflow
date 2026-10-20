import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "@nestjs/authentication";
import type { AuthenticatedUser } from "../auth/auth.service.js";
import { RequireWorkspacePermission } from "../workspaces/require-workspace-permission.decorator.js";
import { CurrentWorkspace, type WorkspaceAccess } from "../workspaces/workspace-access.js";
import { WorkspaceMembershipGuard } from "../workspaces/workspace-membership.guard.js";
import { WorkspacePermissionGuard } from "../workspaces/workspace-permission.guard.js";
import { WorkspacePermission } from "../workspaces/workspace-permissions.js";
import { ConfirmReconciliationDto } from "./dto/confirm-reconciliation.dto.js";

const idempotencyKeyPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
import {
  ReconciliationService,
  type ReconciliationSuggestionsResponse,
} from "./reconciliation.service.js";

@Controller(
  "workspaces/:workspaceId/bank-transactions/:bankTransactionId/reconciliation-suggestions",
)
@UseGuards(WorkspaceMembershipGuard, WorkspacePermissionGuard)
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  @Get()
  @RequireWorkspacePermission(WorkspacePermission.VIEW)
  listSuggestions(
    @CurrentWorkspace() access: WorkspaceAccess,
    @Param("bankTransactionId", new ParseUUIDPipe()) bankTransactionId: string,
  ): Promise<ReconciliationSuggestionsResponse> {
    return this.reconciliationService.listSuggestions(access, bankTransactionId);
  }

  @Post("confirm")
  @RequireWorkspacePermission(WorkspacePermission.MANAGE_FINANCIAL_DATA)
  confirm(
    @CurrentWorkspace() access: WorkspaceAccess,
    @CurrentUser() user: AuthenticatedUser,
    @Param("bankTransactionId", new ParseUUIDPipe()) bankTransactionId: string,
    @Body() input: ConfirmReconciliationDto,
    @Headers("idempotency-key") idempotencyKey: string | undefined,
  ) {
    if (idempotencyKey === undefined || !idempotencyKeyPattern.test(idempotencyKey.trim())) {
      throw new BadRequestException({
        code: "INVALID_IDEMPOTENCY_KEY",
        message: "The idempotency-key header must be a UUID.",
      });
    }

    return this.reconciliationService.confirm(
      access,
      user.id,
      bankTransactionId,
      input,
      idempotencyKey.trim().toLowerCase(),
    );
  }
}
