ALTER TABLE "Event" ADD COLUMN "seriesId" UUID;
CREATE INDEX "Event_seriesId_startAt_idx" ON "Event"("seriesId", "startAt");
