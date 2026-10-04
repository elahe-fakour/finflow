import { PasswordHasher, SessionService } from "@nestjs/authentication";
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Prisma } from "../generated/prisma/client.js";
import { AuthRepository } from "./auth.repository.js";
import type { LoginDto } from "./dto/login.dto.js";
import type { RegisterDto } from "./dto/register.dto.js";

export type AuthenticatedUser = {
  id: string;
  email: string;
  displayName: string | null;
};

export type LoginResult = {
  user: AuthenticatedUser;
  cookie: string;
};

export type SessionRequest = {
  headers: Record<string, string | string[] | undefined>;
  method?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly sessionService: SessionService,
  ) {}

  async register(input: RegisterDto): Promise<AuthenticatedUser> {
    const passwordHash = await this.passwordHasher.hash(input.password);

    try {
      const user = await this.authRepository.createUser({
        email: input.email,
        ...(input.displayName === undefined ? {} : { displayName: input.displayName }),
        passwordHash,
      });

      return toAuthenticatedUser(user);
    } catch (error) {
      if (isUniqueEmailViolation(error)) {
        throw new ConflictException({
          code: "EMAIL_ALREADY_REGISTERED",
          message: "An account already exists for this email address.",
        });
      }

      throw error;
    }
  }

  async login(input: LoginDto, request: SessionRequest): Promise<LoginResult> {
    rejectCrossOriginWrite(this.sessionService, request);

    const user = await this.authRepository.findUserWithPasswordCredential(input.email);
    const passwordIsValid = await this.passwordHasher.verify(
      input.password,
      user?.passwordCredential?.passwordHash,
    );

    if (!passwordIsValid || user === null || user.passwordCredential === null) {
      throw invalidCredentials();
    }

    if (this.passwordHasher.needsRehash(user.passwordCredential.passwordHash)) {
      const passwordHash = await this.passwordHasher.hash(input.password);
      await this.authRepository.updatePasswordHash(user.id, passwordHash);
    }

    const issuedSession = await this.sessionService.create(user.id, {
      replacing: this.sessionService.tokenFrom(request),
    });

    return {
      user: toAuthenticatedUser(user),
      cookie: issuedSession.cookie,
    };
  }

  async getCurrentUser(request: SessionRequest): Promise<AuthenticatedUser> {
    const session = await this.sessionService.validate(this.sessionService.tokenFrom(request));

    if (session === null) {
      throw unauthenticated();
    }

    const user = await this.authRepository.findPublicUserById(session.userId);

    if (user === null) {
      await this.sessionService.discard(session.id);
      throw unauthenticated();
    }

    return toAuthenticatedUser(user);
  }

  async logout(request: SessionRequest): Promise<string> {
    rejectCrossOriginWrite(this.sessionService, request);

    const session = await this.sessionService.validate(this.sessionService.tokenFrom(request));

    if (session !== null) {
      await this.sessionService.discard(session.id);
    }

    return this.sessionService.clearCookie();
  }
}

function invalidCredentials(): UnauthorizedException {
  return new UnauthorizedException({
    code: "INVALID_CREDENTIALS",
    message: "Invalid email or password.",
  });
}

function unauthenticated(): UnauthorizedException {
  return new UnauthorizedException({
    code: "UNAUTHENTICATED",
    message: "Authentication is required.",
  });
}

function rejectCrossOriginWrite(sessionService: SessionService, request: SessionRequest): void {
  if (sessionService.isCrossOriginWrite(request)) {
    throw new ForbiddenException({
      code: "CROSS_ORIGIN_REQUEST_FORBIDDEN",
      message: "Cross-origin authentication requests are not allowed.",
    });
  }
}

function isUniqueEmailViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function toAuthenticatedUser(user: {
  id: string;
  email: string;
  displayName: string | null;
}): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
  };
}
