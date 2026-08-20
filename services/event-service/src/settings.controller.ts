import { Body, Controller, Get, Patch } from "@nestjs/common";
import { IsArray, IsObject, IsOptional, IsString } from "class-validator";
import { PrismaService } from "./prisma.service.js";

export class UpdateSettingsDto {
  @IsOptional() @IsString() outlookStammordner?: string;
  @IsOptional() @IsArray() @IsObject({ each: true }) outlookJahresordner?: { jahr: string; url: string }[];
  @IsOptional() @IsArray() @IsObject({ each: true }) jahresSites?: { jahr: string; url: string }[];
}

@Controller("api/v1/settings")
export class SettingsController {
  constructor(private readonly prisma: PrismaService) {}
  @Get() get() { return this.prisma.appSettings.upsert({ where: { id: 1 }, create: {}, update: {} }); }
  @Patch() update(@Body() dto: UpdateSettingsDto) { return this.prisma.appSettings.upsert({ where: { id: 1 }, create: { ...dto, id: 1 }, update: dto }); }
}
