import { Module } from "@nestjs/common";
import { OutlookFolderService } from "./outlook.folder.service.js";
import { MicrosoftGraphClient } from "./outlook.graph.client.js";
import { PrismaService } from "../prisma.service.js";

@Module({ providers: [PrismaService, { provide: "OUTLOOK_GRAPH_CLIENT", useClass: MicrosoftGraphClient }, { provide: OutlookFolderService, useFactory: (prisma: PrismaService, graph: MicrosoftGraphClient) => new OutlookFolderService(prisma, graph), inject: [PrismaService, "OUTLOOK_GRAPH_CLIENT"] }], exports: [OutlookFolderService] })
export class OutlookModule {}
