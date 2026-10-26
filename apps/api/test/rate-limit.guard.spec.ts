import { HttpException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { RateLimitGuard } from "../src/security/rate-limit.guard.js";

describe("RateLimitGuard", () => {
  it("rejects requests after the configured burst limit", () => {
    const guard = new RateLimitGuard();
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ ip: "127.0.0.1", path: "/internal/test" }),
      }),
    } as never;

    for (let index = 0; index < 10; index += 1) expect(guard.canActivate(context)).toBe(true);
    expect(() => guard.canActivate(context)).toThrow(HttpException);
  });
});
