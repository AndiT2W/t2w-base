import { Module } from "@nestjs/common";
import { OutlookFolderService } from "./outlook.folder.service.js";
import { MicrosoftGraphClient } from "./outlook.graph.client.js";
import { PrismaService } from "../prisma.service.js";
import { EventCommunicationHub } from "./event-communication.hub.js";
import { PrismaEventCommunicationAdapter } from "./prisma-event-communication.adapter.js";

@Module({
  providers: [
    PrismaService,
    MicrosoftGraphClient,
    PrismaEventCommunicationAdapter,
    { provide: "OUTLOOK_GRAPH_CLIENT", useExisting: MicrosoftGraphClient },
    { provide: OutlookFolderService, useFactory: (prisma: PrismaService, graph: MicrosoftGraphClient) => new OutlookFolderService(prisma, graph), inject: [PrismaService, "OUTLOOK_GRAPH_CLIENT"] },
    { provide: EventCommunicationHub, useFactory: (repository: PrismaEventCommunicationAdapter, graph: MicrosoftGraphClient) => new EventCommunicationHub(repository, graph), inject: [PrismaEventCommunicationAdapter, "OUTLOOK_GRAPH_CLIENT"] },
  ],
  exports: [OutlookFolderService, EventCommunicationHub],
})
export class OutlookModule {}
