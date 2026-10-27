import { afterEach, describe, expect, it } from "vitest";
import { getSessionCookieOptions, getTrustedWebOrigins } from "../src/auth/auth-config.js";

const originalNodeEnv = process.env.NODE_ENV;
const originalWebOrigin = process.env.WEB_ORIGIN;

afterEach(() => {
  restoreEnv("NODE_ENV", originalNodeEnv);
  restoreEnv("WEB_ORIGIN", originalWebOrigin);
});

describe("authentication configuration", () => {
  it("requires an explicit HTTPS origin in production", () => {
    process.env.NODE_ENV = "production";
    delete process.env.WEB_ORIGIN;

    expect(() => getTrustedWebOrigins()).toThrow(
      "WEB_ORIGIN must be configured with an HTTPS origin in production.",
    );

    process.env.WEB_ORIGIN = "http://finflow.example";
    expect(() => getTrustedWebOrigins()).toThrow("WEB_ORIGIN must use HTTPS in production.");
  });

  it("normalizes a configured development origin", () => {
    process.env.NODE_ENV = "development";
    process.env.WEB_ORIGIN = "http://localhost:3000/";

    expect(getTrustedWebOrigins()).toEqual(["http://localhost:3000"]);
  });

  it("keeps the __Host session cookie attributes explicit", () => {
    expect(getSessionCookieOptions()).toEqual({
      secure: true,
      sameSite: "lax",
      path: "/",
    });
  });
});

function restoreEnv(name: "NODE_ENV" | "WEB_ORIGIN", value: string | undefined): void {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}
