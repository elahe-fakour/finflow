import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { configureApp, configureNotFoundHandler } from "../src/app.config.js";
import { AppModule } from "../src/app.module.js";
import { AuthService } from "../src/auth/auth.service.js";
import { WorkspacesService } from "../src/workspaces/workspaces.service.js";

describe("Authentication HTTP endpoints", () => {
  let app: INestApplication;
  const authService = {
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  };
  const workspacesService = {
    createForOwner: vi.fn(),
    getForMember: vi.fn(),
    renameForManager: vi.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AuthService)
      .useValue(authService)
      .overrideProvider(WorkspacesService)
      .useValue(workspacesService)
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
      user: {
        id: "6efc89d9-c720-45f6-82cd-ee29e80314b4",
        email: "owner@acme.example",
        displayName: "Acme Owner",
      },
      cookie: "__Host-sid=session-token; HttpOnly; Secure; SameSite=Lax",
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
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("__Host-sid=session-token")]),
    );
    expect(authService.login).toHaveBeenCalledWith(
      {
        email: "owner@acme.example",
        password: "a secure passphrase",
      },
      expect.objectContaining({ method: "POST" }),
    );
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

  it("requires a valid session before the current-user endpoint reaches its controller", async () => {
    const callsBeforeRequest = authService.getCurrentUser.mock.calls.length;
    const response = await request(app.getHttpServer()).get("/api/v1/auth/me").expect(401);

    expect(response.body).toMatchObject({
      code: "UNAUTHENTICATED",
      message: "Unauthorized",
    });
    expect(authService.getCurrentUser).toHaveBeenCalledTimes(callsBeforeRequest);
  });

  it("requires a valid session before workspace creation reaches its controller", async () => {
    const callsBeforeRequest = workspacesService.createForOwner.mock.calls.length;

    const response = await request(app.getHttpServer())
      .post("/api/v1/workspaces")
      .send({ name: "Acme Studio" })
      .expect(401);

    expect(response.body).toMatchObject({
      code: "UNAUTHENTICATED",
      message: "Unauthorized",
    });
    expect(workspacesService.createForOwner).toHaveBeenCalledTimes(callsBeforeRequest);
  });

  it("requires a valid session before workspace lookup reaches its controller", async () => {
    const callsBeforeRequest = workspacesService.getForMember.mock.calls.length;

    const response = await request(app.getHttpServer())
      .get("/api/v1/workspaces/6efc89d9-c720-45f6-82cd-ee29e80314b5")
      .expect(401);

    expect(response.body).toMatchObject({
      code: "UNAUTHENTICATED",
      message: "Unauthorized",
    });
    expect(workspacesService.getForMember).toHaveBeenCalledTimes(callsBeforeRequest);
  });

  it("requires a valid session before workspace settings changes reach its controller", async () => {
    const callsBeforeRequest = workspacesService.renameForManager.mock.calls.length;

    const response = await request(app.getHttpServer())
      .patch("/api/v1/workspaces/6efc89d9-c720-45f6-82cd-ee29e80314b5")
      .send({ name: "Renamed Studio" })
      .expect(401);

    expect(response.body).toMatchObject({
      code: "UNAUTHENTICATED",
      message: "Unauthorized",
    });
    expect(workspacesService.renameForManager).toHaveBeenCalledTimes(callsBeforeRequest);
  });

  it("clears the cookie after logout", async () => {
    authService.logout.mockResolvedValue("__Host-sid=; Max-Age=0; HttpOnly; Secure; SameSite=Lax");

    const response = await request(app.getHttpServer())
      .post("/api/v1/auth/logout")
      .set("Cookie", "__Host-sid=session-token")
      .expect(204);

    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("Max-Age=0")]),
    );
    expect(authService.logout).toHaveBeenCalledWith(expect.objectContaining({ method: "POST" }));
  });
});
