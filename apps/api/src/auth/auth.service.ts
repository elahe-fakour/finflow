import { PasswordHasher } from "@nestjs/authentication";
import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client.js";
import { AuthRepository } from "./auth.repository.js";
import type { LoginDto } from "./dto/login.dto.js";
import type { RegisterDto } from "./dto/register.dto.js";

export type AuthenticatedUser = {
  id: string;
  email: string;
  displayName: string | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly passwordHasher: PasswordHasher,
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

  async login(input: LoginDto): Promise<AuthenticatedUser> {
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

    return toAuthenticatedUser(user);
  }
}

function invalidCredentials(): UnauthorizedException {
  return new UnauthorizedException({
    code: "INVALID_CREDENTIALS",
    message: "Invalid email or password.",
  });
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
