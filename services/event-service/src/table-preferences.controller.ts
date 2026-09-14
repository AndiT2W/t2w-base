import { Body, Controller, Get, Param, Put, Req } from "@nestjs/common";
import { ArrayMaxSize, IsArray, IsIn, IsObject, IsString, MaxLength } from "class-validator";
import type { Request } from "express";
import { Prisma } from "@prisma/client";
import { PrismaService } from "./prisma.service.js";

type AuthRequest = Request & { user: { id: string } };

class UpdateTablePreferenceDto {
  @IsArray()
  @ArrayMaxSize(40)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  visible!: string[];

  @IsObject()
  sort!: { key: string; direction: "asc" | "desc" };

  @IsIn([1])
  version!: 1;
}

/** The authenticated-user seam for durable, non-domain table settings. */
@Controller("api/v1/table-preferences")
export class TablePreferencesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(":tableId")
  async get(@Param("tableId") tableId: string, @Req() req: AuthRequest) {
    const preference = await this.prisma.userTablePreference.findUnique({
      where: { userId_tableId: { userId: req.user.id, tableId } },
      select: { value: true, updatedAt: true },
    });
    return { value: preference?.value ?? null, updatedAt: preference?.updatedAt ?? null };
  }

  @Put(":tableId")
  async put(
    @Param("tableId") tableId: string,
    @Body() value: UpdateTablePreferenceDto,
    @Req() req: AuthRequest,
  ) {
    const storedValue = {
      version: value.version,
      visible: value.visible,
      sort: value.sort,
    } satisfies Prisma.InputJsonObject;
    const preference = await this.prisma.userTablePreference.upsert({
      where: { userId_tableId: { userId: req.user.id, tableId } },
      create: { userId: req.user.id, tableId, value: storedValue },
      update: { value: storedValue },
      select: { value: true, updatedAt: true },
    });
    return preference;
  }
}
