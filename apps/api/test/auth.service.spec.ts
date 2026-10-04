import { PasswordHasher } from "@nestjs/authentication";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { Prisma, type User } from "../src/generated/prisma/client.js";
import { AuthRepository, type UserWithPasswordCredential } from "../src/auth/auth.repository.js";
import { AuthService } from "../src/auth/auth.service.js";
import { describe, expect, it, vi } from "vitest";

const registeredUser = {
  id: "6efc89d9-c720-45f6-82cd-ee29e80314b4",
  email: "owner@acme.example",
  displayName: "Acme Owner",
  createdAt: new Date("2026-10-04T00:00:00.000Z"),
  updatedAt: new Date("2026-10-04T00:00:00.000Z"),
} satisfies User;

describe("AuthService", () => {
  it("hashes a password and creates a public user record during registration", async () => {
    const repository = createRepository({
      createUser: vi.fn().mockResolvedValue(registeredUser),
    });
    const passwordHasher = createPasswordHasher({
      hash: vi.fn().mockResolvedValue("password-hash"),
    });
    const service = new AuthService(repository, passwordHasher);

    await expect(
      service.register({
        email: "owner@acme.example",
        displayName: "Acme Owner",
        password: "a secure passphrase",
      }),
    ).resolves.toEqual({
      id: registeredUser.id,
      email: registeredUser.email,
      displayName: registeredUser.displayName,
    });

    expect(passwordHasher.hash).toHaveBeenCalledWith("a secure passphrase");
    expect(repository.createUser).toHaveBeenCalledWith({
      email: "owner@acme.example",
      displayName: "Acme Owner",
      passwordHash: "password-hash",
    });
  });

  it("maps the database email uniqueness constraint to a safe conflict response", async () => {
    const uniqueConstraintError = new Prisma.PrismaClientKnownRequestError("Unique constraint", {
      code: "P2002",
      clientVersion: "test",
    });
    const repository = createRepository({
      createUser: vi.fn().mockRejectedValue(uniqueConstraintError),
    });
    const service = new AuthService(repository, createPasswordHasher());

    const error = await service
      .register({
        email: "owner@acme.example",
        password: "a secure passphrase",
      })
      .catch((caughtError: unknown) => caughtError);

    expect(error).toBeInstanceOf(ConflictException);
    expect((error as ConflictException).getResponse()).toMatchObject({
      code: "EMAIL_ALREADY_REGISTERED",
    });
  });

  it("verifies a stored password and returns only public user data at login", async () => {
    const user = withCredential(registeredUser, "stored-password-hash");
    const repository = createRepository({
      findUserWithPasswordCredential: vi.fn().mockResolvedValue(user),
    });
    const passwordHasher = createPasswordHasher({
      verify: vi.fn().mockResolvedValue(true),
      needsRehash: vi.fn().mockReturnValue(false),
    });
    const service = new AuthService(repository, passwordHasher);

    await expect(
      service.login({
        email: "owner@acme.example",
        password: "a secure passphrase",
      }),
    ).resolves.toEqual({
      id: registeredUser.id,
      email: registeredUser.email,
      displayName: registeredUser.displayName,
    });

    expect(passwordHasher.verify).toHaveBeenCalledWith(
      "a secure passphrase",
      "stored-password-hash",
    );
    expect(repository.updatePasswordHash).not.toHaveBeenCalled();
  });

  it("uses the password hasher's dummy verification for an unknown email", async () => {
    const repository = createRepository({
      findUserWithPasswordCredential: vi.fn().mockResolvedValue(null),
    });
    const passwordHasher = createPasswordHasher({
      verify: vi.fn().mockResolvedValue(false),
    });
    const service = new AuthService(repository, passwordHasher);

    const error = await service
      .login({
        email: "missing@acme.example",
        password: "a secure passphrase",
      })
      .catch((caughtError: unknown) => caughtError);

    expect(error).toBeInstanceOf(UnauthorizedException);
    expect((error as UnauthorizedException).getResponse()).toMatchObject({
      code: "INVALID_CREDENTIALS",
    });

    expect(passwordHasher.verify).toHaveBeenCalledWith("a secure passphrase", undefined);
  });

  it("rehashes a valid password when the configured hashing cost has changed", async () => {
    const user = withCredential(registeredUser, "old-password-hash");
    const repository = createRepository({
      findUserWithPasswordCredential: vi.fn().mockResolvedValue(user),
    });
    const passwordHasher = createPasswordHasher({
      verify: vi.fn().mockResolvedValue(true),
      needsRehash: vi.fn().mockReturnValue(true),
      hash: vi.fn().mockResolvedValue("upgraded-password-hash"),
    });
    const service = new AuthService(repository, passwordHasher);

    await service.login({
      email: "owner@acme.example",
      password: "a secure passphrase",
    });

    expect(repository.updatePasswordHash).toHaveBeenCalledWith(
      registeredUser.id,
      "upgraded-password-hash",
    );
  });
});

function withCredential(user: User, passwordHash: string): UserWithPasswordCredential {
  return {
    ...user,
    passwordCredential: { passwordHash },
  };
}

function createRepository(overrides: Partial<AuthRepository> = {}): AuthRepository {
  return {
    createUser: vi.fn(),
    findUserWithPasswordCredential: vi.fn(),
    updatePasswordHash: vi.fn(),
    ...overrides,
  } as unknown as AuthRepository;
}

function createPasswordHasher(overrides: Partial<PasswordHasher> = {}): PasswordHasher {
  return {
    hash: vi.fn(),
    verify: vi.fn(),
    needsRehash: vi.fn(),
    ...overrides,
  } as unknown as PasswordHasher;
}
