ALTER TABLE "Event"
ADD COLUMN "outlookMessageSyncStatus" "SyncStatus" NOT NULL DEFAULT 'NEVER',
ADD COLUMN "outlookMessageLastSuccessAt" TIMESTAMP(3),
ADD COLUMN "outlookMessageLastError" TEXT;

CREATE TABLE "EventCommunicationMessage" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "eventId" UUID NOT NULL,
  "mailbox" TEXT NOT NULL,
  "externalId" TEXT NOT NULL,
  "conversationId" TEXT,
  "direction" TEXT NOT NULL,
  "author" TEXT NOT NULL,
  "recipients" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "preview" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "hasAttachments" BOOLEAN NOT NULL DEFAULT false,
  "webUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EventCommunicationMessage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EventCommunicationMessage_mailbox_externalId_key"
ON "EventCommunicationMessage"("mailbox", "externalId");
CREATE INDEX "EventCommunicationMessage_eventId_occurredAt_idx"
ON "EventCommunicationMessage"("eventId", "occurredAt");
ALTER TABLE "EventCommunicationMessage" ADD CONSTRAINT "EventCommunicationMessage_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
