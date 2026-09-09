CREATE TYPE "HardwareIssueType" AS ENUM ('PARTICIPANT', 'RENTAL', 'OTHER');
CREATE TYPE "HardwareStatus" AS ENUM ('OPEN', 'MAIL_SEND', 'NOTIFIED', 'RETURNED', 'COMPLETED');
CREATE TYPE "ObjectNumberType" AS ENUM ('SINGLE', 'RANGE', 'NONE');
CREATE TABLE "HardwareIssue" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "eventId" UUID NOT NULL, "recipientName" TEXT NOT NULL,
  "issueType" "HardwareIssueType" NOT NULL, "objectName" TEXT NOT NULL, "objectNumberType" "ObjectNumberType" NOT NULL,
  "objectNumberSingle" TEXT, "objectNumberPrefix" TEXT, "objectNumberFrom" INTEGER, "objectNumberTo" INTEGER,
  "objectNumberPadding" INTEGER, "quantity" INTEGER NOT NULL, "status" "HardwareStatus" NOT NULL DEFAULT 'OPEN',
  "email" TEXT, "phone" TEXT, "issuedAt" TIMESTAMP(3), "dueDate" TIMESTAMP(3), "returnedAt" TIMESTAMP(3), "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HardwareIssue_pkey" PRIMARY KEY ("id"), CONSTRAINT "HardwareIssue_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "HardwareIssue_eventId_status_idx" ON "HardwareIssue"("eventId", "status");
CREATE INDEX "HardwareIssue_status_dueDate_idx" ON "HardwareIssue"("status", "dueDate");
