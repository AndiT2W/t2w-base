ALTER TABLE "Organizer" ADD COLUMN "primaryContactId" UUID;
ALTER TABLE "Organizer" ADD CONSTRAINT "Organizer_primaryContactId_fkey" FOREIGN KEY ("primaryContactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
