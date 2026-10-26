import { CanActivate, Injectable, HttpException, type ExecutionContext } from "@nestjs/common";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly requests = new Map<string, { count: number; resetAt: number }>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ ip?: string; path: string }>();
    const key = `${request.ip ?? "unknown"}:${request.path}`;
    const now = Date.now();
    const current = this.requests.get(key);
    const bucket =
      !current || current.resetAt <= now ? { count: 0, resetAt: now + WINDOW_MS } : current;

    bucket.count += 1;
    this.requests.set(key, bucket);

    if (bucket.count > MAX_REQUESTS) {
      throw new HttpException("Too many requests. Please try again later.", 429);
    }

    return true;
  }
}
