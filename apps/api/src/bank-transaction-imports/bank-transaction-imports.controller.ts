import { Body, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { RequireWorkspacePermission } from "../workspaces/require-workspace-permission.decorator.js";
import { CurrentWorkspace, type WorkspaceAccess } from "../workspaces/workspace-access.js";
import { WorkspaceMembershipGuard } from "../workspaces/workspace-membership.guard.js";
import { WorkspacePermissionGuard } from "../workspaces/workspace-permission.guard.js";
import { WorkspacePermission } from "../workspaces/workspace-permissions.js";
import {
  BankTransactionImportsService,
  type BankTransactionImportPreview,
} from "./bank-transaction-imports.service.js";
import { PreviewBankTransactionImportDto } from "./dto/preview-bank-transaction-import.dto.js";

@Controller("workspaces/:workspaceId/bank-transaction-imports")
@UseGuards(WorkspaceMembershipGuard, WorkspacePermissionGuard)
export class BankTransactionImportsController {
  constructor(private readonly importsService: BankTransactionImportsService) {}

  @Post("preview")
  @RequireWorkspacePermission(WorkspacePermission.MANAGE_FINANCIAL_DATA)
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 1_000_000, files: 1 } }))
  preview(
    @CurrentWorkspace() access: WorkspaceAccess,
    @Body() input: PreviewBankTransactionImportDto,
    @UploadedFile()
    file: { buffer: Buffer; mimetype: string; originalname: string; size: number } | undefined,
  ): Promise<BankTransactionImportPreview> {
    return this.importsService.preview(access, input.bankAccountId, file);
  }
}
