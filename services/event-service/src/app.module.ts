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
import { EventMutations } from "./event-mutations.js";
import { PrismaEventMutationAdapter } from "./prisma-event-mutation.adapter.js";
import { Time2winService } from "./time2win.service.js";
import { HttpTime2winAdapter, TIME2WIN_ADAPTER } from "./time2win.adapter.js";

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
    Time2winService,
    { provide: TIME2WIN_ADAPTER, useClass: HttpTime2winAdapter },
    AuthService,
    {
      provide: EventMutations,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) =>
        new EventMutations(new PrismaEventMutationAdapter(prisma)),
    },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}
