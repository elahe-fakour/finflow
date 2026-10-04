import { Public } from "@nestjs/authentication";
import { Controller, Get } from "@nestjs/common";

export type HealthResponse = {
  status: "ok";
};

@Controller("health")
export class HealthController {
  @Get()
  @Public()
  getHealth(): HealthResponse {
    return { status: "ok" };
  }
}
