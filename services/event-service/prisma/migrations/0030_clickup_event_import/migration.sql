ALTER TABLE "Event"
  ADD COLUMN "clickUpId" TEXT,
  ADD COLUMN "clickUpUrl" TEXT,
  ADD COLUMN "clickUpUpdatedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Event_clickUpId_key" ON "Event"("clickUpId");

CREATE TABLE "EventClickUpSource" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "eventId" UUID NOT NULL,
  "clickUpId" TEXT NOT NULL,
  "taskUrl" TEXT,
  "taskUpdatedAt" TIMESTAMP(3),
  "sourceData" JSONB NOT NULL,
  "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventClickUpSource_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EventClickUpSource_eventId_key" ON "EventClickUpSource"("eventId");
CREATE UNIQUE INDEX "EventClickUpSource_clickUpId_key" ON "EventClickUpSource"("clickUpId");

ALTER TABLE "EventClickUpSource"
  ADD CONSTRAINT "EventClickUpSource_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
