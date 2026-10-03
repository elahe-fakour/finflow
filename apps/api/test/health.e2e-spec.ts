import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { ValidationError } from "class-validator";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { configureApp, configureNotFoundHandler } from "../src/app.config.js";
import { AppModule } from "../src/app.module.js";
import { createValidationException } from "../src/common/http/validation-exception.js";

describe("API HTTP conventions", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    configureNotFoundHandler(app);
    await app.listen(0, "127.0.0.1");
  });

  afterAll(async () => {
    await app.close();
  });

  it("serves the liveness endpoint under API version 1", async () => {
    const response = await request(app.getHttpServer()).get("/api/v1/health").expect(200);

    expect(response.body).toEqual({ status: "ok" });
  });

  it("returns the standard error shape for an unknown route", async () => {
    const response = await request(app.getHttpServer()).get("/health").expect(404);

    expect(response.body).toMatchObject({
      statusCode: 404,
      error: "Not Found",
      code: "HTTP_404",
      message: "Cannot GET /health",
      path: "/health",
    });
    expect(response.body.timestamp).toEqual(expect.any(String));
  });

  it("converts validation failures into safe structured details", () => {
    const errors: ValidationError[] = [
      {
        property: "email",
        children: [],
        constraints: {
          isEmail: "email must be an email",
        },
      },
    ];

    const exception = createValidationException(errors);

    expect(exception.getStatus()).toBe(400);
    expect(exception.getResponse()).toEqual({
      code: "VALIDATION_FAILED",
      message: "Request validation failed.",
      details: [
        {
          field: "email",
          messages: ["email must be an email"],
        },
      ],
    });
  });
});
