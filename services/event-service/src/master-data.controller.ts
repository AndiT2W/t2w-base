import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PrismaService } from "./prisma.service.js";

@ApiTags("master-data")
@Controller("api/v1")
export class MasterDataController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("organizers") organizers() { return this.prisma.organizer.findMany({ where: { active: true }, orderBy: { name: "asc" }, include: { contacts: { include: { contact: true } } } }); }
  @Post("organizers") organizer(@Body() body: { name: string; type?: "ORGANISATION" | "PERSON"; billingInfo?: string; payoutInfo?: string }) { return this.prisma.organizer.create({ data: { name: body.name, type: body.type ?? "ORGANISATION", billingInfo: body.billingInfo, payoutInfo: body.payoutInfo } }); }
  @Patch("organizers/:id/deactivate") deactivateOrganizer(@Param("id", ParseUUIDPipe) id: string) { return this.prisma.organizer.update({ where: { id }, data: { active: false } }); }

  @Get("sports") sports() { return this.prisma.sport.findMany({ where: { active: true }, orderBy: { name: "asc" } }); }
  @Post("sports") sport(@Body() body: { name: string }) { return this.prisma.sport.create({ data: { name: body.name } }); }
  @Patch("sports/:id/deactivate") deactivateSport(@Param("id", ParseUUIDPipe) id: string) { return this.prisma.sport.update({ where: { id }, data: { active: false } }); }

  @Get("contacts") contacts() { return this.prisma.contact.findMany({ orderBy: { name: "asc" } }); }
  @Post("contacts") contact(@Body() body: { name: string; email?: string; phone?: string }) { return this.prisma.contact.create({ data: body }); }
}
