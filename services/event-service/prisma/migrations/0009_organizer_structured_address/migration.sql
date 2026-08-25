ALTER TABLE "Organizer" ADD COLUMN "country" TEXT;
ALTER TABLE "Organizer" ADD COLUMN "city" TEXT;
ALTER TABLE "Organizer" ADD COLUMN "street" TEXT;
ALTER TABLE "Organizer" ADD COLUMN "postalCode" TEXT;
ALTER TABLE "Organizer" ADD COLUMN "email" TEXT;
UPDATE "Organizer" SET "street" = "address" WHERE "street" IS NULL AND "address" IS NOT NULL;
UPDATE "Organizer" SET "email" = "invoiceEmail" WHERE "email" IS NULL AND "invoiceEmail" IS NOT NULL;
