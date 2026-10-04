import {
  AuthenticationStorage,
  type SessionRecord,
  type SessionStore,
} from "@nestjs/authentication";
import { Injectable } from "@nestjs/common";
import { Prisma, type UserSession } from "../generated/prisma/client.js";
import { PrismaService } from "../database/prisma.service.js";

@Injectable()
export class PrismaSessionStore implements SessionStore {
  constructor(
    private readonly prisma: PrismaService,
    authenticationStorage: AuthenticationStorage,
  ) {
    authenticationStorage.registerSource({ sessions: this });
  }

  async getSession(id: string): Promise<SessionRecord | undefined> {
    const session = await this.prisma.database.userSession.findUnique({
      where: { id },
    });

    return session === null ? undefined : toSessionRecord(session);
  }

  async createSession(record: SessionRecord): Promise<void> {
    const database = this.prisma.database;

    await database.userSession.deleteMany({
      where: {
        expiresAt: {
          lt: record.createdAt,
        },
      },
    });
    await database.userSession.create({
      data: {
        id: record.id,
        userId: record.userId,
        createdAt: record.createdAt,
        expiresAt: record.expiresAt,
        lastActiveAt: record.lastActiveAt,
        metadata: record.metadata === undefined ? Prisma.JsonNull : toInputJson(record.metadata),
      },
    });
  }

  async touchSession(id: string, lastActiveAt: Date): Promise<void> {
    await this.prisma.database.userSession.updateMany({
      where: {
        id,
        lastActiveAt: {
          lt: lastActiveAt,
        },
      },
      data: { lastActiveAt },
    });
  }

  async deleteSession(id: string): Promise<boolean> {
    const result = await this.prisma.database.userSession.deleteMany({
      where: { id },
    });

    return result.count === 1;
  }

  async listUserSessions(userId: string): Promise<SessionRecord[]> {
    const sessions = await this.prisma.database.userSession.findMany({
      where: { userId },
    });

    return sessions.map(toSessionRecord);
  }

  async deleteUserSessions(userId: string): Promise<void> {
    await this.prisma.database.userSession.deleteMany({
      where: { userId },
    });
  }
}

function toSessionRecord(session: UserSession): SessionRecord {
  return {
    id: session.id,
    userId: session.userId,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    lastActiveAt: session.lastActiveAt,
    ...(isRecord(session.metadata) ? { metadata: session.metadata } : {}),
  };
}

function toInputJson(metadata: Record<string, unknown>): Prisma.InputJsonValue {
  return metadata as Prisma.InputJsonValue;
}

function isRecord(value: Prisma.JsonValue | null): value is Prisma.JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
