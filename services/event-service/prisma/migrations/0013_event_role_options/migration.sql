CREATE TABLE "EventRoleOption" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EventRoleOption_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EventRoleOption_name_key" ON "EventRoleOption"("name");

INSERT INTO "EventRoleOption" ("id", "name", "updatedAt")
VALUES
  (gen_random_uuid(), 'Anmeldung', CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Finanz', CURRENT_TIMESTAMP);
