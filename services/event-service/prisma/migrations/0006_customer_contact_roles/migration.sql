ALTER TABLE "Organizer" ADD COLUMN "address" TEXT;
ALTER TABLE "Organizer" ADD COLUMN "uid" TEXT;
ALTER TABLE "Organizer" ADD COLUMN "iban" TEXT;
ALTER TABLE "Organizer" ADD COLUMN "bic" TEXT;
ALTER TABLE "Organizer" ADD COLUMN "bankName" TEXT;
ALTER TABLE "Organizer" ADD COLUMN "invoiceEmail" TEXT;
ALTER TABLE "Organizer" ADD COLUMN "personId" UUID;
CREATE UNIQUE INDEX "Organizer_personId_key" ON "Organizer"("personId");

ALTER TABLE "Contact" ADD COLUMN "firstName" TEXT;
ALTER TABLE "Contact" ADD COLUMN "lastName" TEXT;
ALTER TABLE "Contact" ADD COLUMN "note" TEXT;
ALTER TABLE "Contact" ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Contact" ADD COLUMN "syncSource" TEXT;
ALTER TABLE "Contact" ADD COLUMN "externalId" TEXT;
ALTER TABLE "Contact" ADD COLUMN "syncStatus" "SyncStatus" NOT NULL DEFAULT 'NEVER';
ALTER TABLE "Contact" ADD COLUMN "lastSyncedAt" TIMESTAMP(3);

ALTER TABLE "Event" ADD COLUMN "payoutRecipientId" UUID;
CREATE TABLE "EventInvoiceRecipient" (
  "eventId" UUID NOT NULL,
  "organizerId" UUID NOT NULL,
  CONSTRAINT "EventInvoiceRecipient_pkey" PRIMARY KEY ("eventId", "organizerId")
);
CREATE INDEX "Event_payoutRecipientId_idx" ON "Event"("payoutRecipientId");
ALTER TABLE "Organizer" ADD CONSTRAINT "Organizer_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Event" ADD CONSTRAINT "Event_payoutRecipientId_fkey" FOREIGN KEY ("payoutRecipientId") REFERENCES "Organizer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EventInvoiceRecipient" ADD CONSTRAINT "EventInvoiceRecipient_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventInvoiceRecipient" ADD CONSTRAINT "EventInvoiceRecipient_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "Organizer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
