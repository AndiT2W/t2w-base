ALTER TABLE "Contact" ADD COLUMN "privatePhone" TEXT;
ALTER TABLE "Contact" ADD COLUMN "workPhone" TEXT;
ALTER TABLE "Contact" ADD COLUMN "country" TEXT;
ALTER TABLE "Contact" ADD COLUMN "city" TEXT;
ALTER TABLE "Contact" ADD COLUMN "street" TEXT;
ALTER TABLE "Contact" ADD COLUMN "postalCode" TEXT;
UPDATE "Contact" SET "privatePhone" = "phone" WHERE "privatePhone" IS NULL AND "phone" IS NOT NULL;
