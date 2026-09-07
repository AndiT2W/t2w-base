CREATE TABLE "ServiceOption" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ServiceOption_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ServiceOption_name_key" ON "ServiceOption"("name");

CREATE TABLE "EventService" (
  "eventId" UUID NOT NULL,
  "serviceId" UUID NOT NULL,
  CONSTRAINT "EventService_pkey" PRIMARY KEY ("eventId", "serviceId"),
  CONSTRAINT "EventService_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "EventService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ServiceOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "ServiceOption" ("id", "name", "updatedAt") VALUES
  (gen_random_uuid(), 'UHF', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Active', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Streaming', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Foto', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Video (iRewind)', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'GPS', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Virtuell', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Anmeldung (only)', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'App', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Jörg', CURRENT_TIMESTAMP);
