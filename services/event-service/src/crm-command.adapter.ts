import type { Prisma, PrismaClient } from "@prisma/client";
import type { CrmCommandAdapter, ReferenceSnapshot } from "@t2w/domain/crm";

export type CustomerProfileInput = {
  country?: string;
  city?: string;
  street?: string;
  postalCode?: string;
  uid?: string;
  iban?: string;
  bic?: string;
  bankName?: string;
  email?: string;
};
export type OrganizerInput = CustomerProfileInput & {
  name: string;
  personId?: string | null;
  primaryContactId?: string | null;
  active?: boolean;
};
export type ContactInput = {
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
  archived?: boolean;
  syncSource?: string;
  externalId?: string;
  syncStatus?: "NEVER" | "SYNCING" | "SUCCESS" | "ERROR";
  lastSyncedAt?: string | Date | null;
  externalUrl?: string;
};

type CustomerProfile = Prisma.OrganizerGetPayload<{ include: { person: true } }>;

export class PrismaCrmCommandAdapter implements CrmCommandAdapter<
  CustomerProfileInput,
  CustomerProfile,
  OrganizerInput,
  unknown,
  ContactInput,
  unknown
> {
  constructor(private readonly prisma: PrismaClient) {}

  organizers() {
    return this.prisma.organizer.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      include: {
        contacts: { include: { contact: true } },
        events: { select: { eventCode: true, name: true } },
        payoutEvents: { select: { eventCode: true, name: true } },
        invoiceRecipients: { include: { event: { select: { eventCode: true, name: true } } } },
        person: true,
        primaryContact: true,
      },
    });
  }
  createOrganizer(input: OrganizerInput) {
    return this.prisma.organizer.create({
      data: {
        ...input,
        personId: input.personId ?? undefined,
        type: input.personId ? "PERSON" : "ORGANISATION",
      },
    });
  }
  async updateOrganizer(id: string, input: Partial<OrganizerInput>) {
    if (!(await this.prisma.organizer.findUnique({ where: { id }, select: { id: true } })))
      return null;
    return this.prisma.organizer.update({ where: { id }, data: input });
  }
  async deactivateOrganizer(id: string) {
    return this.updateOrganizer(id, { active: false });
  }
  contacts() {
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
  createContact(input: ContactInput) {
    return this.prisma.contact.create({ data: input });
  }
  async updateContact(id: string, input: Partial<ContactInput>) {
    if (!(await this.prisma.contact.findUnique({ where: { id }, select: { id: true } })))
      return null;
    return this.prisma.contact.update({ where: { id }, data: input });
  }

  async organizerReferences(id: string): Promise<ReferenceSnapshot | null> {
    const references = await this.prisma.organizer.findUnique({
      where: { id },
      include: {
        events: { select: { id: true } },
        payoutEvents: { select: { id: true } },
        invoiceRecipients: { select: { eventId: true } },
        contacts: { select: { contactId: true } },
        person: { select: { id: true } },
        primaryContact: { select: { id: true } },
      },
    });
    return references
      ? {
          events: references.events.length,
          payoutEvents: references.payoutEvents.length,
          invoiceRecipients: references.invoiceRecipients.length,
          contacts: references.contacts.length,
          person: Boolean(references.person),
          primaryContact: Boolean(references.primaryContact),
          eventRoles: 0,
          customerProfile: false,
        }
      : null;
  }

  async contactReferences(id: string): Promise<ReferenceSnapshot | null> {
    const references = await this.prisma.contact.findUnique({
      where: { id },
      include: {
        organizers: { select: { organizerId: true } },
        eventRoles: { select: { eventId: true } },
        customerProfile: { select: { id: true } },
        primaryForOrganizers: { select: { id: true } },
      },
    });
    return references
      ? {
          events: 0,
          payoutEvents: 0,
          invoiceRecipients: 0,
          contacts: references.organizers.length,
          person: false,
          primaryContact: references.primaryForOrganizers.length > 0,
          eventRoles: references.eventRoles.length,
          customerProfile: Boolean(references.customerProfile),
        }
      : null;
  }

  async deleteOrganizer(id: string) {
    await this.prisma.organizer.delete({ where: { id } });
  }
  async deleteContact(id: string) {
    await this.prisma.contact.delete({ where: { id } });
  }
  async linkContact(organizerId: string, contactId: string) {
    await this.prisma.organizerContact.upsert({
      where: { organizerId_contactId: { organizerId, contactId } },
      create: { organizerId, contactId },
      update: {},
    });
  }
  async unlinkContact(organizerId: string, contactId: string) {
    await this.prisma.organizerContact.deleteMany({ where: { organizerId, contactId } });
  }
  async upsertCustomerProfile(contactId: string, input: CustomerProfileInput) {
    return this.prisma.$transaction(async (tx) => {
      const person = await tx.contact.findUniqueOrThrow({ where: { id: contactId } });
      return tx.organizer.upsert({
        where: { personId: contactId },
        create: { name: person.name, type: "PERSON", personId: contactId, ...input },
        update: input,
        include: { person: true },
      });
    });
  }
}
