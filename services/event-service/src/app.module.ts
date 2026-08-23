import { Module } from "@nestjs/common";
import { EventsController } from "./events.controller.js";
import { HealthController } from "./health.controller.js";
import { PrismaService } from "./prisma.service.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { MasterDataController } from "./master-data.controller.js";
import { AuthGuard } from "./auth.guard.js";
import { APP_GUARD } from "@nestjs/core";
import { SettingsController } from "./settings.controller.js";
import { OutlookModule } from "./outlook/outlook.module.js";
import { EventMutationService } from "./event-mutation.service.js";

@Module({
  imports: [OutlookModule],
  controllers: [
    HealthController,
    EventsController,
    AuthController,
    MasterDataController,
    SettingsController,
  ],
  providers: [
    PrismaService,
    AuthService,
    EventMutationService,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}
