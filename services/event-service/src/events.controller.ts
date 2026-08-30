import {
  Body,
  ConflictException,
  Controller,
  Get,
  Delete,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { EventStatus } from "@prisma/client";
import { PrismaService } from "./prisma.service.js";
import { OutlookFolderService } from "./outlook/outlook.folder.service.js";
import { EventMutationConflict, EventMutations } from "./event-mutations.js";
import { Time2winService } from "./time2win.service.js";
import { EventCommunicationHub } from "./outlook/event-communication.hub.js";

export class CreateEventDto {
  @IsOptional() @IsString() eventCode?: string;
  @IsString() name!: string;
  @IsDateString() startAt!: string;
  @IsOptional() @IsDateString() endAt?: string;
  @IsOptional() @IsEnum(EventStatus) status?: EventStatus;
  @IsOptional() @IsString() organizerId?: string;
  @IsOptional() @IsString() sportId?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() responsible?: string;
  @IsOptional() @IsInt() @Min(0) participantForecast?: number;
  @IsOptional() @IsInt() t2wEventId?: number;
  @IsOptional() @IsBoolean() archived?: boolean;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() outlookFolder?: string;
  @IsOptional() @IsString() outlookWebUrl?: string;
  @IsOptional() @IsString() sharepointFolder?: string;
  @IsOptional() @IsString() payoutRecipientId?: string;
  @IsOptional() invoiceRecipientIds?: string[];
}
class CopyEventDto {
  @IsString() name!: string;
  @IsString() eventCode!: string;
  @IsDateString() startAt!: string;
  @IsDateString() endAt!: string;
  @IsOptional() @IsBoolean() createRelationship?: boolean;
  @IsOptional() @IsInt() version?: number;
}

@ApiTags("events")
@Controller("api/v1/events")
export class EventsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outlookFolders: OutlookFolderService,
    private readonly eventMutations: EventMutations,
    private readonly time2win: Time2winService,
    private readonly communication: EventCommunicationHub,
  ) {}

  @Post(":id/outlook-folder/sync")
  async syncOutlookFolder(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: { mailbox?: string },
  ) {
    return this.outlookFolders.syncEventFolder(id, dto.mailbox);
  }

  @Get(":id/outlook-folder/plan")
  outlookFolderPlan(@Param("id", ParseUUIDPipe) id: string) {
    return this.outlookFolders.eventFolderPlan(id);
  }

  @Post(":id/outlook-messages/sync")
  syncOutlookMessages(@Param("id", ParseUUIDPipe) id: string) {
    return this.communication.syncEvent(id);
  }

  @Get()
  list(@Query("q") q?: string, @Query("limit") limit = "200", @Query("offset") offset = "0") {
    const take = Math.min(Math.max(Number(limit) || 200, 1), 1000);
    const skip = Math.max(Number(offset) || 0, 0);
    return this.prisma.event.findMany({
      where: {
        archived: false,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { eventCode: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { startAt: "asc" },
      skip,
      take,
      include: {
        organizer: true,
        sport: true,
        contacts: { include: { contact: true } },
        payoutRecipient: true,
        invoiceRecipients: { include: { organizer: true } },
        tasks: true,
        files: true,
        activities: true,
        communicationMessages: { orderBy: { occurredAt: "desc" } },
      },
    });
  }

  @Get(":id") get(@Param("id", ParseUUIDPipe) id: string) {
    return this.prisma.event.findUniqueOrThrow({
      where: { id },
      include: {
        organizer: true,
        sport: true,
        contacts: { include: { contact: true } },
        payoutRecipient: true,
        invoiceRecipients: { include: { organizer: true } },
        tasks: true,
        files: true,
        activities: true,
        communicationMessages: { orderBy: { occurredAt: "desc" } },
      },
    });
  }

  @Post()
  create(@Body() dto: CreateEventDto) {
    return this.eventMutations.create(dto);
  }

  @Post(":id/copy")
  copy(@Param("id", ParseUUIDPipe) id: string, @Body() dto: CopyEventDto) {
    return this.eventMutations.copy(id, {
      ...dto,
      createRelationship: dto.createRelationship ?? true,
    });
  }

  @Patch(":id") update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateEventDto> & { version?: number },
  ) {
    return this.eventMutations.update(id, dto).catch((error: unknown) => {
      if (error instanceof EventMutationConflict)
        throw new ConflictException("EVENT_VERSION_CONFLICT");
      throw error;
    });
  }

  @Post(":id/time2win/sync")
  syncTime2win(@Param("id", ParseUUIDPipe) id: string) {
    return this.time2win.syncEvent(id);
  }

  @Post(":id/contacts/:contactId")
  async addContact(
    @Param("id", ParseUUIDPipe) eventId: string,
    @Param("contactId", ParseUUIDPipe) contactId: string,
    @Body() body: { role?: string; version: number },
  ) {
    return this.mutate(() =>
      this.eventMutations.addContact(eventId, contactId, body.role ?? "Kontakt", body.version),
    );
  }

  @Patch(":id/contacts/:contactId/:role")
  async updateContactRole(
    @Param("id", ParseUUIDPipe) eventId: string,
    @Param("contactId", ParseUUIDPipe) contactId: string,
    @Param("role") role: string,
    @Body() body: { role?: string; version: number },
  ) {
    return this.mutate(() =>
      this.eventMutations.updateContactRole(
        eventId,
        contactId,
        role,
        body.role ?? "Kontakt",
        body.version,
      ),
    );
  }

  @Delete(":id/contacts/:contactId/:role")
  async removeContact(
    @Param("id", ParseUUIDPipe) eventId: string,
    @Param("contactId", ParseUUIDPipe) contactId: string,
    @Param("role") role: string,
    @Body() body: { version: number },
  ) {
    return this.mutate(() =>
      this.eventMutations.removeContact(eventId, contactId, role, body.version),
    );
  }

  @Post(":id/tasks") createTask(
    @Param("id", ParseUUIDPipe) eventId: string,
    @Body() body: { title: string; dueAt?: string; responsible?: string; version: number },
  ) {
    const { version, ...input } = body;
    return this.mutate(() => this.eventMutations.createTask(eventId, input, version));
  }
  @Patch(":id/tasks/:taskId") updateTask(
    @Param("id", ParseUUIDPipe) eventId: string,
    @Param("taskId", ParseUUIDPipe) taskId: string,
    @Body()
    body: {
      title?: string;
      dueAt?: string | null;
      responsible?: string;
      completed?: boolean;
      version: number;
    },
  ) {
    const { version, ...input } = body;
    return this.mutate(() => this.eventMutations.updateTask(eventId, taskId, input, version));
  }
  @Post(":id/files") createFile(
    @Param("id", ParseUUIDPipe) eventId: string,
    @Body() body: { name: string; url?: string; size?: string; version: number },
  ) {
    const { version, ...input } = body;
    return this.mutate(() => this.eventMutations.createFile(eventId, input, version));
  }
  @Post(":id/activities") createActivity(
    @Param("id", ParseUUIDPipe) eventId: string,
    @Body()
    body: {
      channel: string;
      subject: string;
      author?: string;
      body?: string;
      occurredAt?: string;
      version: number;
    },
  ) {
    const { version, ...input } = body;
    return this.mutate(() => this.eventMutations.createActivity(eventId, input, version));
  }

  private mutate(work: () => Promise<unknown>) {
    return work().catch((error: unknown) => {
      if (error instanceof EventMutationConflict)
        throw new ConflictException("EVENT_VERSION_CONFLICT");
      throw error;
    });
  }
}
