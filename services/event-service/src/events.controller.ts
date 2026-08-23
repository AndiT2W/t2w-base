import {
  Body,
  ConflictException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { EventStatus } from "@prisma/client";
import { PrismaService } from "./prisma.service.js";
import { OutlookFolderService } from "./outlook/outlook.folder.service.js";
import { EventMutationConflict } from "./event-mutations.js";
import { EventMutationService } from "./event-mutation.service.js";

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly outlookFolders: OutlookFolderService,
    private readonly eventMutations: EventMutationService,
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
      include: { organizer: true, sport: true },
    });
  }

  @Get(":id") get(@Param("id", ParseUUIDPipe) id: string) {
    return this.prisma.event.findUniqueOrThrow({
      where: { id },
      include: { organizer: true, sport: true, contacts: { include: { contact: true } } },
    });
  }

  @Post()
  create(@Body() dto: CreateEventDto) {
    const start = new Date(dto.startAt);
    return this.eventMutations.create({
      ...dto,
      eventCode:
        dto.eventCode?.trim() ||
        `${start.toISOString().slice(2, 10).replaceAll("-", "")}_event_${Date.now()}`,
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
}
