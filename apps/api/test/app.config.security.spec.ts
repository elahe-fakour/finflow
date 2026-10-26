import { describe, expect, it, vi } from "vitest";
import { configureApp, getCorsOrigins } from "../src/app.config.js";

describe("HTTP security configuration", () => {
  it("uses the configured web origin", () => {
    process.env.WEB_ORIGIN = "https://finflow.example";
    expect(getCorsOrigins()).toEqual(["https://finflow.example"]);
    delete process.env.WEB_ORIGIN;
  });

  it("does not allow a fallback origin in production", () => {
    process.env.NODE_ENV = "production";
    expect(getCorsOrigins()).toEqual([]);
    delete process.env.NODE_ENV;
  });

  it("registers CORS and security headers", () => {
    const enableCors = vi.fn();
    const use = vi.fn();
    configureApp({
      enableCors,
      use,
      get: vi.fn(),
      setGlobalPrefix: vi.fn(),
      enableVersioning: vi.fn(),
      useGlobalPipes: vi.fn(),
      useGlobalFilters: vi.fn(),
    } as never);
    expect(enableCors).toHaveBeenCalledWith(expect.objectContaining({ credentials: true }));
    const response = { setHeader: vi.fn() };
    use.mock.calls[0][0](null, response, vi.fn());
    expect(response.setHeader).toHaveBeenCalledWith("X-Frame-Options", "DENY");
  });
});
