import { Injectable } from "@nestjs/common";
import type { PrismaClient, User } from "../generated/prisma/client.js";
import { PrismaService } from "../database/prisma.service.js";

type AuthenticationQueryClient = Pick<PrismaClient, "user" | "userCredential">;

export type UserWithPasswordCredential = User & {
  passwordCredential: {
    passwordHash: string;
  } | null;
};

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  createUser(
    input: {
      email: string;
      displayName?: string;
      passwordHash: string;
    },
    database: AuthenticationQueryClient = this.prisma.database,
  ): Promise<User> {
    return database.user.create({
      data: {
        email: input.email,
        displayName: input.displayName,
        passwordCredential: {
          create: {
            passwordHash: input.passwordHash,
          },
        },
      },
    });
  }

  findUserWithPasswordCredential(
    email: string,
    database: AuthenticationQueryClient = this.prisma.database,
  ): Promise<UserWithPasswordCredential | null> {
    return database.user.findUnique({
      where: { email },
      include: {
        passwordCredential: {
          select: {
            passwordHash: true,
          },
        },
      },
    });
  }

  findPublicUserById(
    userId: string,
    database: AuthenticationQueryClient = this.prisma.database,
  ): Promise<Pick<User, "id" | "email" | "displayName"> | null> {
    return database.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
      },
    });
  }

  updatePasswordHash(
    userId: string,
    passwordHash: string,
    database: AuthenticationQueryClient = this.prisma.database,
  ): Promise<void> {
    return database.userCredential
      .update({
        where: { userId },
        data: { passwordHash },
      })
      .then(() => undefined);
  }
}
