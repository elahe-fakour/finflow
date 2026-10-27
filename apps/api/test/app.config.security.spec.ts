import { afterEach, describe, expect, it, vi } from "vitest";
import { configureApp, getCorsOrigins } from "../src/app.config.js";

const originalNodeEnv = process.env.NODE_ENV;
const originalWebOrigin = process.env.WEB_ORIGIN;

afterEach(() => {
  restoreEnv("NODE_ENV", originalNodeEnv);
  restoreEnv("WEB_ORIGIN", originalWebOrigin);
});

describe("HTTP security configuration", () => {
  it("uses the configured web origin", () => {
    process.env.WEB_ORIGIN = "https://finflow.example";
    expect(getCorsOrigins()).toEqual(["https://finflow.example"]);
  });

  it("does not allow a fallback origin in production", () => {
    process.env.NODE_ENV = "production";
    expect(() => getCorsOrigins()).toThrow(
      "WEB_ORIGIN must be configured with an HTTPS origin in production.",
    );
  });

  it("registers CORS and security headers", () => {
    process.env.WEB_ORIGIN = "https://finflow.example";
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

function restoreEnv(name: "NODE_ENV" | "WEB_ORIGIN", value: string | undefined): void {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}
