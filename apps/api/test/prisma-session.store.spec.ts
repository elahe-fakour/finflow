import { AuthenticationStorage, type SessionRecord } from "@nestjs/authentication";
import { Prisma } from "../src/generated/prisma/client.js";
import { PrismaSessionStore } from "../src/auth/prisma-session.store.js";
import type { PrismaService } from "../src/database/prisma.service.js";
import { describe, expect, it, vi } from "vitest";

const session = {
  id: "sha256-session-verifier",
  userId: "6efc89d9-c720-45f6-82cd-ee29e80314b4",
  createdAt: new Date("2026-10-04T00:00:00.000Z"),
  expiresAt: new Date("2026-10-11T00:00:00.000Z"),
  lastActiveAt: new Date("2026-10-04T00:00:00.000Z"),
} satisfies SessionRecord;

describe("PrismaSessionStore", () => {
  it("registers itself as the application's session store", () => {
    const authenticationStorage = {
      registerSource: vi.fn(),
    } as unknown as AuthenticationStorage;

    new PrismaSessionStore(createPrismaService(), authenticationStorage);

    expect(authenticationStorage.registerSource).toHaveBeenCalledWith({
      sessions: expect.any(PrismaSessionStore),
    });
  });

  it("stores only the supplied session verifier and removes expired rows during creation", async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 0 });
    const create = vi.fn().mockResolvedValue(session);
    const store = new PrismaSessionStore(
      createPrismaService({ deleteMany, create }),
      createAuthenticationStorage(),
    );

    await store.createSession(session);

    expect(deleteMany).toHaveBeenCalledWith({
      where: {
        expiresAt: {
          lt: session.createdAt,
        },
      },
    });
    expect(create).toHaveBeenCalledWith({
      data: {
        ...session,
        metadata: Prisma.JsonNull,
      },
    });
  });

  it("only moves last activity forward for an existing session", async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const store = new PrismaSessionStore(
      createPrismaService({ updateMany }),
      createAuthenticationStorage(),
    );
    const touchedAt = new Date("2026-10-04T01:00:00.000Z");

    await store.touchSession(session.id, touchedAt);

    expect(updateMany).toHaveBeenCalledWith({
      where: {
        id: session.id,
        lastActiveAt: {
          lt: touchedAt,
        },
      },
      data: { lastActiveAt: touchedAt },
    });
  });

  it("maps database rows back to the session-store contract", async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        ...session,
        metadata: { device: "Chrome" },
      },
    ]);
    const store = new PrismaSessionStore(
      createPrismaService({ findMany }),
      createAuthenticationStorage(),
    );

    await expect(store.listUserSessions(session.userId)).resolves.toEqual([
      {
        ...session,
        metadata: { device: "Chrome" },
      },
    ]);
  });

  it("reports whether a delete removed exactly one session", async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 1 });
    const store = new PrismaSessionStore(
      createPrismaService({ deleteMany }),
      createAuthenticationStorage(),
    );

    await expect(store.deleteSession(session.id)).resolves.toBe(true);
    await store.deleteUserSessions(session.userId);

    expect(deleteMany).toHaveBeenNthCalledWith(1, {
      where: { id: session.id },
    });
    expect(deleteMany).toHaveBeenNthCalledWith(2, {
      where: { userId: session.userId },
    });
  });
});

function createPrismaService(userSession: Record<string, unknown> = {}): PrismaService {
  return {
    database: {
      userSession: {
        create: vi.fn(),
        deleteMany: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        updateMany: vi.fn(),
        ...userSession,
      },
    },
  } as unknown as PrismaService;
}

function createAuthenticationStorage(): AuthenticationStorage {
  return {
    registerSource: vi.fn(),
  } as unknown as AuthenticationStorage;
}
