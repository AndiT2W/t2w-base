CREATE TYPE "PayoutMailStatus" AS ENUM ('ENTWURF', 'VERSENDEN', 'GESENDET');
CREATE TYPE "PayoutPaymentStatus" AS ENUM ('OFFEN', 'AUSBEZAHLT', 'STORNIERT');
CREATE TABLE "PayoutNumberSequence" ("year" INTEGER NOT NULL PRIMARY KEY, "nextValue" INTEGER NOT NULL DEFAULT 1);
CREATE TABLE "Payout" (
 "id" UUID NOT NULL PRIMARY KEY, "payoutNumber" TEXT NOT NULL UNIQUE, "year" INTEGER NOT NULL,
 "eventId" UUID, "recipientId" UUID, "recipientSnapshot" JSONB, "amount" DECIMAL(18,2) NOT NULL,
 "currency" TEXT NOT NULL DEFAULT 'EUR', "mailStatus" "PayoutMailStatus" NOT NULL DEFAULT 'ENTWURF',
 "paymentStatus" "PayoutPaymentStatus" NOT NULL DEFAULT 'OFFEN', "transactionReference" TEXT,
 "paidAt" TIMESTAMP(3), "mailSentAt" TIMESTAMP(3), "mailRecipient" TEXT, "n8nCorrelationId" TEXT,
 "externalMessageId" TEXT, "automationWorkflowId" TEXT, "automationClaimedAt" TIMESTAMP(3),
 "automationRetryCount" INTEGER NOT NULL DEFAULT 0, "automationLastError" TEXT, "clickUpId" TEXT UNIQUE,
 "notes" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "AutomationClaim" ("id" UUID NOT NULL PRIMARY KEY, "domain" TEXT NOT NULL, "recordId" TEXT NOT NULL, "idempotencyKey" TEXT NOT NULL UNIQUE, "workflowId" TEXT, "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "completedAt" TIMESTAMP(3));
CREATE INDEX "Payout_eventId_paymentStatus_idx" ON "Payout"("eventId", "paymentStatus");
CREATE INDEX "Payout_year_mailStatus_idx" ON "Payout"("year", "mailStatus");
CREATE INDEX "Payout_recipientId_idx" ON "Payout"("recipientId");
CREATE INDEX "AutomationClaim_domain_recordId_idx" ON "AutomationClaim"("domain", "recordId");
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Organizer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE OR REPLACE FUNCTION "audit_log_append_only"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'AuditLog is append-only';
END;
$$;
CREATE TRIGGER "AuditLog_append_only_update" BEFORE UPDATE ON "AuditLog" FOR EACH ROW EXECUTE FUNCTION "audit_log_append_only"();
CREATE TRIGGER "AuditLog_append_only_delete" BEFORE DELETE ON "AuditLog" FOR EACH ROW EXECUTE FUNCTION "audit_log_append_only"();
