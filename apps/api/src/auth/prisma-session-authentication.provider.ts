import {
  AuthenticationRegistry,
  SessionCookieProvider,
  type SessionRecord,
} from "@nestjs/authentication";
import { Injectable } from "@nestjs/common";
import type { AuthenticatedUser } from "./auth.service.js";
import { AuthRepository } from "./auth.repository.js";

@Injectable()
export class PrismaSessionAuthenticationProvider extends SessionCookieProvider<AuthenticatedUser> {
  constructor(
    private readonly authRepository: AuthRepository,
    authenticationRegistry: AuthenticationRegistry,
  ) {
    super();
    authenticationRegistry.registerProvider(this);
  }

  protected validate(session: SessionRecord): Promise<AuthenticatedUser | null> {
    return this.authRepository.findPublicUserById(session.userId);
  }
}
