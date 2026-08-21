import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { EventStatus } from "@prisma/client";
import { PrismaService } from "./prisma.service.js";
import { OutlookFolderService } from "./outlook/outlook.folder.service.js";

export class CreateEventDto {
  @IsOptional() @IsString() eventCode?: string;
  @IsString() name!: string;
  @IsDateString() startAt!: string;
  @IsOptional() @IsDateString() endAt?: string;
  @IsOptional() @IsEnum(EventStatus) status?: EventStatus;
  @IsOptional() @IsString() organizerId?: string;
  @IsOptional() @IsString() organizerName?: string;
  @IsOptional() @IsString() sportId?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() responsible?: string;
  @IsOptional() @IsInt() @Min(0) participantForecast?: number;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() outlookFolder?: string;
  @IsOptional() @IsString() outlookWebUrl?: string;
  @IsOptional() @IsString() sharepointFolder?: string;
  @IsOptional() @IsString() payoutRecipientId?: string;
  @IsOptional() invoiceRecipientIds?: string[];
}

@ApiTags("events")
@Controller("api/v1/events")
export class EventsController {
  constructor(private readonly prisma: PrismaService, private readonly outlookFolders: OutlookFolderService) {}

  @Post(":id/outlook-folder/sync")
  async syncOutlookFolder(@Param("id", ParseUUIDPipe) id: string, @Body() dto: { mailbox?: string }) {
    const settings = await this.prisma.appSettings.findUnique({ where: { id: 1 } });
    const mailbox = dto.mailbox?.trim() || settings?.outlookMailbox;
    if (!mailbox) throw new Error("OUTLOOK_SETTINGS_MISSING");
    const event = await this.prisma.event.findUniqueOrThrow({ where: { id } });
    const mappings = Array.isArray(settings?.outlookJahresordner) ? settings.outlookJahresordner as { jahr?: string; url?: string }[] : [];
    const mapping = mappings.find((entry) => entry.jahr === String(event.startAt.getUTCFullYear()));
    if (!mapping?.url?.trim()) throw new Error(`OUTLOOK_YEAR_FOLDER_MISSING:${event.startAt.getUTCFullYear()}`);
    return this.outlookFolders.ensureEventFolder(id, mailbox, mapping.url);
  }

  @Get()
  list(@Query("q") q?: string, @Query("limit") limit = "200", @Query("offset") offset = "0") {
    const take = Math.min(Math.max(Number(limit) || 200, 1), 1000);
    const skip = Math.max(Number(offset) || 0, 0);
    return this.prisma.event.findMany({
      where: { archived: false, ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { eventCode: { contains: q, mode: "insensitive" } }] } : {}) },
      orderBy: { startAt: "asc" }, skip, take,
      include: { organizer: true, sport: true },
    });
  }

  @Get(":id") get(@Param("id", ParseUUIDPipe) id: string) {
    return this.prisma.event.findUniqueOrThrow({ where: { id }, include: { organizer: true, sport: true, contacts: { include: { contact: true } } } });
  }

  @Post()
  create(@Body() dto: CreateEventDto) {
    const start = new Date(dto.startAt);
    return this.prisma.$transaction(async (tx) => {
      const organizerId = dto.organizerName?.trim()
        ? (await tx.organizer.findFirst({ where: { name: dto.organizerName.trim(), active: true } }))?.id
          ?? (await tx.organizer.create({ data: { name: dto.organizerName.trim(), type: "ORGANISATION" } })).id
        : dto.organizerId;
      return tx.event.create({
        data: { eventCode: dto.eventCode?.trim() || `${start.toISOString().slice(2, 10).replaceAll("-", "")}_event_${Date.now()}`, name: dto.name, startAt: start, endAt: new Date(dto.endAt ?? dto.startAt), status: dto.status ?? EventStatus.ANFRAGE, organizerId, payoutRecipientId: dto.payoutRecipientId ?? organizerId, invoiceRecipients: { create: (dto.invoiceRecipientIds?.length ? dto.invoiceRecipientIds : organizerId ? [organizerId] : []).map((organizerId) => ({ organizerId })) }, sportId: dto.sportId, location: dto.location, responsible: dto.responsible, participantForecast: dto.participantForecast, notes: dto.notes, outlookFolder: dto.outlookFolder, outlookWebUrl: dto.outlookWebUrl, sharepointFolder: dto.sharepointFolder },
        include: { organizer: true, sport: true },
      });
    });
  }

  @Patch(":id") update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: Partial<CreateEventDto> & { version?: number }) {
    const { version, organizerName, invoiceRecipientIds, ...changes } = dto;
    return this.prisma.$transaction(async (tx) => {
      const organizerId = organizerName?.trim()
        ? (await tx.organizer.findFirst({ where: { name: organizerName.trim(), active: true } }))?.id
          ?? (await tx.organizer.create({ data: { name: organizerName.trim(), type: "ORGANISATION" } })).id
        : organizerName === "" ? null : undefined;
      const updated = await tx.event.updateMany({
        where: { id, ...(version === undefined ? {} : { version }) },
        data: { ...changes, organizerId, version: { increment: 1 }, startAt: changes.startAt ? new Date(changes.startAt) : undefined, endAt: changes.endAt ? new Date(changes.endAt) : undefined },
      });
      if (updated.count !== 1) throw new Error("EVENT_VERSION_CONFLICT");
      if (invoiceRecipientIds) {
        await tx.eventInvoiceRecipient.deleteMany({ where: { eventId: id } });
        await tx.eventInvoiceRecipient.createMany({ data: invoiceRecipientIds.map((organizerId) => ({ eventId: id, organizerId })) });
      }
      return tx.event.findUniqueOrThrow({ where: { id }, include: { organizer: true, sport: true } });
    });
  }
}
