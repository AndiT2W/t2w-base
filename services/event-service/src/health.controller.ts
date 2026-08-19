import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";
import { Public } from "./auth.guard.js";

@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}
  @Public() @Get("health") health() { return { status: "ok" }; }
  @Public() @Get("ready") async ready() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: "ready" };
  }
}
