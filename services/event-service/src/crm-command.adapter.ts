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

type CustomerProfile = Prisma.OrganizerGetPayload<{ include: { person: true } }>;

export class PrismaCrmCommandAdapter
  implements CrmCommandAdapter<CustomerProfileInput, CustomerProfile>
{
  constructor(private readonly prisma: PrismaClient) {}

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

  async deleteOrganizer(id: string) { await this.prisma.organizer.delete({ where: { id } }); }
  async deleteContact(id: string) { await this.prisma.contact.delete({ where: { id } }); }
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
