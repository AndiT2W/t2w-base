import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from "@nestjs/common";
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
      include: { contacts: { include: { contact: true } }, person: true, primaryContact: true },
    });
  }
  @Post("organizers") organizer(
    @Body()
    body: {
      name: string;
      personId?: string;
      primaryContactId?: string;
      country?: string;
      city?: string;
      street?: string;
      postalCode?: string;
      uid?: string;
      iban?: string;
      bic?: string;
      bankName?: string;
      email?: string;
    },
  ) {
    return this.prisma.organizer.create({
      data: {
        name: body.name,
        type: body.personId ? "PERSON" : "ORGANISATION",
        personId: body.personId,
        primaryContactId: body.primaryContactId,
        country: body.country,
        city: body.city,
        street: body.street,
        postalCode: body.postalCode,
        uid: body.uid,
        iban: body.iban,
        bic: body.bic,
        bankName: body.bankName,
        email: body.email,
      },
    });
  }
  @Patch("organizers/:id") organizerUpdate(
    @Param("id", ParseUUIDPipe) id: string,
    @Body()
    body: {
      name?: string;
      personId?: string | null;
      primaryContactId?: string | null;
      country?: string;
      city?: string;
      street?: string;
      postalCode?: string;
      uid?: string;
      iban?: string;
      bic?: string;
      bankName?: string;
      email?: string;
    },
  ) {
    return this.prisma.organizer.update({ where: { id }, data: body });
  }
  @Patch("organizers/:id/deactivate") deactivateOrganizer(@Param("id", ParseUUIDPipe) id: string) {
    return this.prisma.organizer.update({ where: { id }, data: { active: false } });
  }
  @Delete("organizers/:id")
  async deleteOrganizer(@Param("id", ParseUUIDPipe) id: string) {
    const references = await this.prisma.organizer.findUniqueOrThrow({ where: { id }, include: { events: true, payoutEvents: true, invoiceRecipients: true, contacts: true, person: true, primaryContact: true } });
    if (references.events.length || references.payoutEvents.length || references.invoiceRecipients.length || references.contacts.length || references.person || references.primaryContact) throw new ConflictException("ORGANIZER_REFERENCED");
    await this.prisma.organizer.delete({ where: { id } });
  }
  @Put("organizers/:organizerId/contacts/:contactId")
  @HttpCode(204)
  async linkContact(
    @Param("organizerId", ParseUUIDPipe) organizerId: string,
    @Param("contactId", ParseUUIDPipe) contactId: string,
  ) {
    await this.prisma.organizerContact.upsert({
      where: { organizerId_contactId: { organizerId, contactId } },
      create: { organizerId, contactId },
      update: {},
    });
  }
  @Delete("organizers/:organizerId/contacts/:contactId")
  @HttpCode(204)
  async unlinkContact(
    @Param("organizerId", ParseUUIDPipe) organizerId: string,
    @Param("contactId", ParseUUIDPipe) contactId: string,
  ) {
    await this.prisma.organizerContact.deleteMany({ where: { organizerId, contactId } });
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
        eventRoles: { include: { event: true } },
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
      privatePhone?: string;
      workPhone?: string;
      country?: string;
      city?: string;
      street?: string;
      postalCode?: string;
      note?: string;
      function?: string;
      location?: string;
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
      privatePhone?: string;
      workPhone?: string;
      country?: string;
      city?: string;
      street?: string;
      postalCode?: string;
      note?: string;
      function?: string;
      location?: string;
      archived?: boolean;
    },
  ) {
    return this.prisma.contact.update({ where: { id }, data: body });
  }
  @Delete("contacts/:id")
  async deleteContact(@Param("id", ParseUUIDPipe) id: string) {
    const references = await this.prisma.contact.findUniqueOrThrow({ where: { id }, include: { organizers: true, eventRoles: true, customerProfile: true, primaryForOrganizers: true } });
    if (references.organizers.length || references.eventRoles.length || references.customerProfile || references.primaryForOrganizers.length) throw new ConflictException("CONTACT_REFERENCED");
    await this.prisma.contact.delete({ where: { id } });
  }
  @Post("contacts/:id/customer-profile") customerProfile(
    @Param("id", ParseUUIDPipe) id: string,
    @Body()
    body: {
      country?: string;
      city?: string;
      street?: string;
      postalCode?: string;
      uid?: string;
      iban?: string;
      bic?: string;
      bankName?: string;
      email?: string;
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
