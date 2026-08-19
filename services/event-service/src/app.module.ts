import { Module } from "@nestjs/common";
import { EventsController } from "./events.controller.js";
import { HealthController } from "./health.controller.js";
import { PrismaService } from "./prisma.service.js";

@Module({ controllers: [HealthController, EventsController], providers: [PrismaService] })
export class AppModule {}
