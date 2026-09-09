CREATE TABLE "HardwareObjectOption" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HardwareObjectOption_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HardwareObjectOption_name_key" ON "HardwareObjectOption"("name");

INSERT INTO "HardwareObjectOption" ("id", "name", "updatedAt") VALUES
  ('9f2a3347-bfef-46d3-b72a-088cfe6f25cf', 'Active Transponder (T2W)', CURRENT_TIMESTAMP),
  ('457f372c-e455-4579-a246-acdb9043da39', 'GPS Tracker (T2W)', CURRENT_TIMESTAMP),
  ('9f4f62d7-aed2-48dc-a51e-a69e5f630f64', 'Active Transponder (Lindinger)', CURRENT_TIMESTAMP),
  ('40f16260-9185-46ce-bb37-a051b0f978d2', 'Active Transponder (BRV)', CURRENT_TIMESTAMP);
