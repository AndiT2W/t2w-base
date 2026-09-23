CREATE TYPE "PayoutStatus" AS ENUM (
  'ENTWURF',
  'VERSANDBEREIT',
  'VERSAND_LAEUFT',
  'MAIL_GESENDET',
  'AUSBEZAHLT',
  'STORNIERT'
);

ALTER TABLE "Payout" ADD COLUMN "status" "PayoutStatus";

UPDATE "Payout"
SET "status" = CASE
  WHEN "paymentStatus" = 'STORNIERT' THEN 'STORNIERT'::"PayoutStatus"
  WHEN "paymentStatus" = 'AUSBEZAHLT' THEN 'AUSBEZAHLT'::"PayoutStatus"
  WHEN "mailStatus" = 'GESENDET' THEN 'MAIL_GESENDET'::"PayoutStatus"
  WHEN "mailStatus" = 'VERSENDEN' AND "automationClaimedAt" IS NOT NULL
    THEN 'VERSAND_LAEUFT'::"PayoutStatus"
  WHEN "mailStatus" = 'VERSENDEN' THEN 'VERSANDBEREIT'::"PayoutStatus"
  ELSE 'ENTWURF'::"PayoutStatus"
END;

ALTER TABLE "Payout"
  ALTER COLUMN "status" SET DEFAULT 'ENTWURF',
  ALTER COLUMN "status" SET NOT NULL;

UPDATE "Payout"
SET "recipientSnapshot" = jsonb_set(
  CASE
    WHEN jsonb_typeof("recipientSnapshot") = 'object' THEN "recipientSnapshot"
    ELSE '{}'::jsonb
  END,
  '{email}',
  to_jsonb("mailRecipient"),
  true
)
WHERE "mailRecipient" IS NOT NULL AND btrim("mailRecipient") <> '';

UPDATE "AutomationClaim" AS claim
SET
  "workflowId" = COALESCE(claim."workflowId", payout."automationWorkflowId"),
  "claimedAt" = COALESCE(payout."automationClaimedAt", claim."claimedAt"),
  "completedAt" = COALESCE(claim."completedAt", payout."mailSentAt"),
  "resultStatus" = COALESCE(
    claim."resultStatus",
    CASE WHEN payout."mailStatus" = 'GESENDET' THEN 'SUCCESS'
         WHEN payout."automationLastError" IS NOT NULL THEN 'FAILED'
         ELSE NULL END
  ),
  "error" = COALESCE(claim."error", payout."automationLastError"),
  "retryCount" = GREATEST(claim."retryCount", payout."automationRetryCount"),
  "externalId" = COALESCE(claim."externalId", payout."externalMessageId")
FROM "Payout" AS payout
WHERE claim."id" = (
  SELECT latest."id"
  FROM "AutomationClaim" AS latest
  WHERE latest."domain" = 'payout' AND latest."recordId" = payout."id"::text
  ORDER BY latest."claimedAt" DESC, latest."updatedAt" DESC
  LIMIT 1
);

INSERT INTO "AutomationClaim" (
  "id", "domain", "recordId", "idempotencyKey", "workflowId", "claimedAt",
  "completedAt", "resultStatus", "error", "retryCount", "externalId", "updatedAt"
)
SELECT
  gen_random_uuid(),
  'payout',
  payout."id"::text,
  'legacy-payout:' || payout."id"::text,
  payout."automationWorkflowId",
  COALESCE(payout."automationClaimedAt", payout."mailSentAt", payout."updatedAt"),
  payout."mailSentAt",
  CASE WHEN payout."mailStatus" = 'GESENDET' THEN 'SUCCESS'
       WHEN payout."automationLastError" IS NOT NULL THEN 'FAILED'
       ELSE NULL END,
  payout."automationLastError",
  payout."automationRetryCount",
  payout."externalMessageId",
  CURRENT_TIMESTAMP
FROM "Payout" AS payout
WHERE (
  payout."mailStatus" = 'GESENDET'
  OR payout."automationWorkflowId" IS NOT NULL
  OR payout."automationClaimedAt" IS NOT NULL
  OR payout."automationRetryCount" > 0
  OR payout."automationLastError" IS NOT NULL
  OR payout."externalMessageId" IS NOT NULL
)
AND NOT EXISTS (
  SELECT 1 FROM "AutomationClaim" AS claim
  WHERE claim."domain" = 'payout' AND claim."recordId" = payout."id"::text
);

DROP INDEX "Payout_eventId_paymentStatus_idx";
DROP INDEX "Payout_year_mailStatus_idx";
CREATE INDEX "Payout_eventId_status_idx" ON "Payout"("eventId", "status");
CREATE INDEX "Payout_year_status_idx" ON "Payout"("year", "status");

ALTER TABLE "Payout"
  DROP COLUMN "mailStatus",
  DROP COLUMN "paymentStatus",
  DROP COLUMN "mailRecipient",
  DROP COLUMN "n8nCorrelationId",
  DROP COLUMN "externalMessageId",
  DROP COLUMN "automationWorkflowId",
  DROP COLUMN "automationClaimedAt",
  DROP COLUMN "automationRetryCount",
  DROP COLUMN "automationLastError";

DROP TYPE "PayoutMailStatus";
DROP TYPE "PayoutPaymentStatus";
