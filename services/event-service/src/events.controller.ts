import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { EventStatus } from "@prisma/client";
import { PrismaService } from "./prisma.service.js";

export class CreateEventDto {
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
  @IsOptional() @IsString() sharepointFolder?: string;
}

@ApiTags("events")
@Controller("api/v1/events")
export class EventsController {
  constructor(private readonly prisma: PrismaService) {}

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
    return this.prisma.event.create({ data: { eventCode: `${start.toISOString().slice(2, 10).replaceAll("-", "")}_event_${Date.now()}`, name: dto.name, startAt: start, endAt: new Date(dto.endAt ?? dto.startAt), status: dto.status ?? EventStatus.ANFRAGE, organizerId: dto.organizerId, sportId: dto.sportId, location: dto.location, responsible: dto.responsible, participantForecast: dto.participantForecast, notes: dto.notes } });
  }

  @Patch(":id") update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: Partial<CreateEventDto> & { version?: number }) {
    const { version, organizerName, ...changes } = dto;
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
      return tx.event.findUniqueOrThrow({ where: { id }, include: { organizer: true, sport: true } });
    });
  }
}
