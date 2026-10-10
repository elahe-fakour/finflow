import { Injectable } from "@nestjs/common";
import type { WorkspaceScope } from "../workspaces/workspace-scope.js";
import { VendorsRepository, type VendorOption } from "./vendors.repository.js";

@Injectable()
export class VendorsService {
  constructor(private readonly vendorsRepository: VendorsRepository) {}

  list(scope: WorkspaceScope): Promise<VendorOption[]> {
    return this.vendorsRepository.list(scope);
  }
}
