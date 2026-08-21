import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PrismaService } from "./prisma.service.js";

@ApiTags("master-data")
@Controller("api/v1")
export class MasterDataController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("organizers") organizers() {
    return this.prisma.organizer.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      include: { contacts: { include: { contact: true } }, person: true },
    });
  }
  @Post("organizers") organizer(
    @Body()
    body: {
      name: string;
      personId?: string;
      address?: string;
      uid?: string;
      iban?: string;
      bic?: string;
      bankName?: string;
      invoiceEmail?: string;
    },
  ) {
    return this.prisma.organizer.create({
      data: {
        name: body.name,
        type: body.personId ? "PERSON" : "ORGANISATION",
        personId: body.personId,
        address: body.address,
        uid: body.uid,
        iban: body.iban,
        bic: body.bic,
        bankName: body.bankName,
        invoiceEmail: body.invoiceEmail,
      },
    });
  }
  @Patch("organizers/:id") organizerUpdate(
    @Param("id", ParseUUIDPipe) id: string,
    @Body()
    body: {
      name?: string;
      personId?: string | null;
      address?: string;
      uid?: string;
      iban?: string;
      bic?: string;
      bankName?: string;
      invoiceEmail?: string;
    },
  ) {
    return this.prisma.organizer.update({ where: { id }, data: body });
  }
  @Patch("organizers/:id/deactivate") deactivateOrganizer(@Param("id", ParseUUIDPipe) id: string) {
    return this.prisma.organizer.update({ where: { id }, data: { active: false } });
  }

  @Get("sports") sports() {
    return this.prisma.sport.findMany({ where: { active: true }, orderBy: { name: "asc" } });
  }
  @Post("sports") sport(@Body() body: { name: string }) {
    return this.prisma.sport.create({ data: { name: body.name } });
  }
  @Patch("sports/:id/deactivate") deactivateSport(@Param("id", ParseUUIDPipe) id: string) {
    return this.prisma.sport.update({ where: { id }, data: { active: false } });
  }

  @Get("contacts") contacts() {
    return this.prisma.contact.findMany({
      where: { archived: false },
      orderBy: { name: "asc" },
      include: {
        organizers: { include: { organizer: true } },
        customerProfile: true,
        eventRoles: true,
      },
    });
  }
  @Post("contacts") contact(
    @Body()
    body: {
      name: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      note?: string;
    },
  ) {
    return this.prisma.contact.create({ data: body });
  }
  @Patch("contacts/:id") contactUpdate(
    @Param("id", ParseUUIDPipe) id: string,
    @Body()
    body: {
      name?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      note?: string;
      archived?: boolean;
    },
  ) {
    return this.prisma.contact.update({ where: { id }, data: body });
  }
  @Post("contacts/:id/customer-profile") customerProfile(
    @Param("id", ParseUUIDPipe) id: string,
    @Body()
    body: {
      address?: string;
      uid?: string;
      iban?: string;
      bic?: string;
      bankName?: string;
      invoiceEmail?: string;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const person = await tx.contact.findUniqueOrThrow({ where: { id } });
      return tx.organizer.upsert({
        where: { personId: id },
        create: { name: person.name, type: "PERSON", personId: id, ...body },
        update: body,
        include: { person: true },
      });
    });
  }
}
