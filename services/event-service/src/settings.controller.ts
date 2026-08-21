import { Body, Controller, Get, Patch } from "@nestjs/common";
import { IsArray, IsObject, IsOptional, IsString } from "class-validator";
import { PrismaService } from "./prisma.service.js";
import { OutlookFolderService } from "./outlook/outlook.folder.service.js";

export class UpdateSettingsDto {
  @IsOptional() @IsArray() @IsObject({ each: true }) outlookJahresordner?: { jahr: string; url: string }[];
  @IsOptional() @IsArray() @IsObject({ each: true }) jahresSites?: { jahr: string; url: string }[];
  @IsOptional() @IsString() outlookMailbox?: string;
}

@Controller("api/v1/settings")
export class SettingsController {
  constructor(private readonly prisma: PrismaService, private readonly outlook: OutlookFolderService) {}
  @Get() get() { return this.prisma.appSettings.upsert({ where: { id: 1 }, create: {}, update: {} }); }
  @Patch() update(@Body() dto: UpdateSettingsDto) { return this.prisma.appSettings.upsert({ where: { id: 1 }, create: { ...dto, id: 1 }, update: dto }); }
  @Get("outlook/status")
  async outlookStatus() {
    const settings = await this.prisma.appSettings.findUnique({ where: { id: 1 } });
    if (!settings?.outlookMailbox) return { connected: false, reason: "OUTLOOK_SETTINGS_MISSING" };
    try { return await this.outlook.checkConnection(settings.outlookMailbox); }
    catch (error) { return { connected: false, reason: error instanceof Error ? error.message : "OUTLOOK_CONNECTION_FAILED" }; }
  }
}
