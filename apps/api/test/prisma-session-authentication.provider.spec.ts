import { PrismaSessionAuthenticationProvider } from "../src/auth/prisma-session-authentication.provider.js";
import type { AuthRepository } from "../src/auth/auth.repository.js";
import type { AuthenticationRegistry, SessionRecord } from "@nestjs/authentication";
import { describe, expect, it, vi } from "vitest";

describe("PrismaSessionAuthenticationProvider", () => {
  it("registers itself and resolves only the public user for a live session", async () => {
    const user = {
      id: "6efc89d9-c720-45f6-82cd-ee29e80314b4",
      email: "owner@acme.example",
      displayName: "Acme Owner",
    };
    const authRepository = {
      findPublicUserById: vi.fn().mockResolvedValue(user),
    };
    const authenticationRegistry = {
      registerProvider: vi.fn(),
    };
    const provider = new TestablePrismaSessionAuthenticationProvider(
      authRepository as unknown as AuthRepository,
      authenticationRegistry as unknown as AuthenticationRegistry,
    );

    await expect(
      provider.validateForTest({
        id: "session-verifier",
        userId: user.id,
        createdAt: new Date("2026-10-04T10:00:00.000Z"),
        expiresAt: new Date("2026-10-11T10:00:00.000Z"),
        lastActiveAt: new Date("2026-10-04T10:00:00.000Z"),
      }),
    ).resolves.toEqual(user);
    expect(authenticationRegistry.registerProvider).toHaveBeenCalledWith(provider);
    expect(authRepository.findPublicUserById).toHaveBeenCalledWith(user.id);
  });
});

class TestablePrismaSessionAuthenticationProvider extends PrismaSessionAuthenticationProvider {
  validateForTest(session: SessionRecord) {
    return this.validate(session);
  }
}
