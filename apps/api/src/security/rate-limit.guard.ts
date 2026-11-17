import { createHash } from "node:crypto";
import { CanActivate, Injectable, HttpException, type ExecutionContext } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service.js";

const WINDOW_MS = 60_000;
const RETENTION_MS = 24 * 60 * 60_000;
const CLEANUP_INTERVAL_MS = 15 * 60_000;
const MAX_REQUESTS = 10;

@Injectable()
export class RateLimitGuard implements CanActivate {
  private lastCleanupAt = 0;

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ ip?: string; user?: { id?: string } }>();
    const now = Date.now();
    const windowStartedAt = new Date(Math.floor(now / WINDOW_MS) * WINDOW_MS);
    const expiresAt = new Date(windowStartedAt.getTime() + WINDOW_MS + RETENTION_MS);
    const identity = request.user?.id ?? request.ip ?? "unknown";
    const route = `${context.getClass().name}:${context.getHandler().name}`;
    const bucketKey = createHash("sha256").update(`${identity}:${route}`).digest("hex");
    const database = this.prisma.database;

    if (now - this.lastCleanupAt >= CLEANUP_INTERVAL_MS) {
      this.lastCleanupAt = now;
      await database.$executeRaw`DELETE FROM rate_limit_buckets WHERE expires_at <= ${new Date(now)}`;
    }

    const [bucket] = await database.$queryRaw<Array<{ hit_count: number }>>`
      INSERT INTO rate_limit_buckets (bucket_key, window_started_at, hit_count, expires_at)
      VALUES (${bucketKey}, ${windowStartedAt}, 1, ${expiresAt})
      ON CONFLICT (bucket_key) DO UPDATE
      SET window_started_at = EXCLUDED.window_started_at,
          hit_count = CASE
            WHEN rate_limit_buckets.window_started_at = EXCLUDED.window_started_at
              THEN rate_limit_buckets.hit_count + 1
            ELSE 1
          END,
          expires_at = EXCLUDED.expires_at
      RETURNING hit_count
    `;

    if (bucket.hit_count > MAX_REQUESTS) {
      throw new HttpException("Too many requests. Please try again later.", 429);
    }

    return true;
  }
}
