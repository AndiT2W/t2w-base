import { Module } from "@nestjs/common";
import { ProjectManagementController } from "./project-management.controller.js";
import { ProjectManagementService } from "./project-management.service.js";
import { EventsController } from "./events.controller.js";
import { HealthController } from "./health.controller.js";
import { PrismaService } from "./prisma.service.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { MasterDataController } from "./master-data.controller.js";
import { AuthGuard } from "./auth.guard.js";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { SettingsController } from "./settings.controller.js";
import { OutlookModule } from "./outlook/outlook.module.js";
import { EventMutations } from "./event-mutations.js";
import { PrismaEventMutationAdapter } from "./prisma-event-mutation.adapter.js";
import { HardwareService } from "./hardware.service.js";
import { Time2winService } from "./time2win.service.js";
import { HttpTime2winAdapter, TIME2WIN_ADAPTER } from "./time2win.adapter.js";
import { EventRecordRetrieval } from "./event-record-retrieval.js";
import { AuditService } from "./audit.service.js";
import { PayoutService } from "./payout.service.js";
import { PayoutController, AutomationController, AuditLogController } from "./payout.controller.js";
import { PayoutImportService } from "./payout-import.service.js";
import { AutomationService } from "./automation.service.js";
import { TablePreferencesController } from "./table-preferences.controller.js";
import { SearchController } from "./search.controller.js";
import { SearchService } from "./search.service.js";
import { IconController } from "./icon.controller.js";
import { IconService } from "./icon.service.js";
import { UserManagementController } from "./user-management.controller.js";
import { UserManagementService } from "./user-management.service.js";
import { SecurityMailService } from "./security-mail.service.js";
import { FinanceDataInterceptor } from "./finance-data.interceptor.js";
import { MailClassifierController } from "./mail-classifier/mail-classifier.controller.js";
import {
  MailClassifierService,
  OLLAMA_CHAT_CLIENT,
} from "./mail-classifier/mail-classifier.service.js";
import { OllamaCloudClient } from "./mail-classifier/ollama-cloud.client.js";

@Module({
  imports: [OutlookModule],
  controllers: [
    ProjectManagementController,
    HealthController,
    EventsController,
    AuthController,
    MasterDataController,
    SettingsController,
    PayoutController,
    AutomationController,
    AuditLogController,
    TablePreferencesController,
    UserManagementController,
    IconController,
    SearchController,
    MailClassifierController,
  ],
  providers: [
    ProjectManagementService,
    PrismaService,
    HardwareService,
    EventRecordRetrieval,
    AuditService,
    PayoutService,
    PayoutImportService,
    AutomationService,
    Time2winService,
    { provide: TIME2WIN_ADAPTER, useClass: HttpTime2winAdapter },
    AuthService,
    SecurityMailService,
    UserManagementService,
    IconService,
    SearchService,
    MailClassifierService,
    OllamaCloudClient,
    { provide: OLLAMA_CHAT_CLIENT, useExisting: OllamaCloudClient },
    {
      provide: EventMutations,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) =>
        new EventMutations(new PrismaEventMutationAdapter(prisma)),
    },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_INTERCEPTOR, useClass: FinanceDataInterceptor },
  ],
})
export class AppModule {}
