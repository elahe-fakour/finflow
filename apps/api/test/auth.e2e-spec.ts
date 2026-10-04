import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { configureApp, configureNotFoundHandler } from "../src/app.config.js";
import { AppModule } from "../src/app.module.js";
import { AuthService } from "../src/auth/auth.service.js";

describe("Authentication HTTP endpoints", () => {
  let app: INestApplication;
  const authService = {
    login: vi.fn(),
    register: vi.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AuthService)
      .useValue(authService)
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    configureNotFoundHandler(app);
    await app.listen(0, "127.0.0.1");
  });

  afterAll(async () => {
    await app.close();
  });

  it("normalizes an email before delegating a login to the service", async () => {
    authService.login.mockResolvedValue({
      id: "6efc89d9-c720-45f6-82cd-ee29e80314b4",
      email: "owner@acme.example",
      displayName: "Acme Owner",
    });

    const response = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({
        email: " OWNER@ACME.EXAMPLE ",
        password: "a secure passphrase",
      })
      .expect(200);

    expect(response.body).toEqual({
      id: "6efc89d9-c720-45f6-82cd-ee29e80314b4",
      email: "owner@acme.example",
      displayName: "Acme Owner",
    });
    expect(authService.login).toHaveBeenCalledWith({
      email: "owner@acme.example",
      password: "a secure passphrase",
    });
  });

  it("rejects invalid login input before the service can access the database", async () => {
    const callsBeforeRequest = authService.login.mock.calls.length;

    const response = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({
        email: "not-an-email",
        password: "short",
      })
      .expect(400);

    expect(response.body).toMatchObject({
      code: "VALIDATION_FAILED",
      message: "Request validation failed.",
      path: "/api/v1/auth/login",
    });
    expect(response.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "email" }),
        expect.objectContaining({ field: "password" }),
      ]),
    );
    expect(authService.login).toHaveBeenCalledTimes(callsBeforeRequest);
  });
});
