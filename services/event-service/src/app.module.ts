import { Module } from "@nestjs/common";
import { EventsController } from "./events.controller.js";
import { HealthController } from "./health.controller.js";
import { PrismaService } from "./prisma.service.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { MasterDataController } from "./master-data.controller.js";

@Module({ controllers: [HealthController, EventsController, AuthController, MasterDataController], providers: [PrismaService, AuthService] })
export class AppModule {}
