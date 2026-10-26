import { Public } from "@nestjs/authentication";
import { Controller, Get } from "@nestjs/common";
import { HealthService } from "./health.service.js";

export type HealthResponse = {
  status: "ok";
};

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Public()
  getHealth() {
    return this.healthService.check();
  }
}
