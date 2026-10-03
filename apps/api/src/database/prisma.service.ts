import { Injectable, type OnModuleDestroy } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

@Injectable()
export class PrismaService implements OnModuleDestroy {
  private client: PrismaClient | undefined;

  /**
   * Creates the database client only when a repository first needs it.
   *
   * This keeps the liveness endpoint independent of PostgreSQL while the API
   * has no database-backed HTTP endpoint yet.
   */
  get database(): PrismaClient {
    if (this.client === undefined) {
      const databaseUrl = process.env.DATABASE_URL;

      if (databaseUrl === undefined || databaseUrl.length === 0) {
        throw new Error("DATABASE_URL must be configured before database access.");
      }

      this.client = new PrismaClient({
        adapter: new PrismaPg({ connectionString: databaseUrl }),
      });
    }

    return this.client;
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.$disconnect();
  }
}
