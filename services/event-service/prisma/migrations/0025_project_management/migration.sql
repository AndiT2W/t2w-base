ALTER TABLE "Event" ADD COLUMN "pmGraphVersion" INTEGER NOT NULL DEFAULT 0, ADD COLUMN "pmTimeZone" TEXT NOT NULL DEFAULT 'Europe/Vienna';

-- CreateTable
CREATE TABLE "PmGroup" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "PmGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PmTask" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "ownerId" UUID,
    "groupId" UUID,
    "nextStep" TEXT NOT NULL DEFAULT '',
    "result" TEXT NOT NULL DEFAULT '',
    "reason" TEXT NOT NULL DEFAULT '',
    "dueType" TEXT NOT NULL DEFAULT 'NONE',
    "dueDate" TEXT,
    "dueAt" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PmTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PmDependency" (
    "predecessorId" UUID NOT NULL,
    "successorId" UUID NOT NULL,

    CONSTRAINT "PmDependency_pkey" PRIMARY KEY ("predecessorId","successorId")
);

-- CreateTable
CREATE TABLE "PmActivity" (
    "id" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PmActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PmLegacySnapshot" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "count" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PmLegacySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PmGroup_name_key" ON "PmGroup"("name");

-- CreateIndex
CREATE INDEX "PmTask_eventId_id_idx" ON "PmTask"("eventId", "id");

-- CreateIndex
CREATE INDEX "PmActivity_taskId_createdAt_idx" ON "PmActivity"("taskId", "createdAt");

-- AddForeignKey
ALTER TABLE "PmTask" ADD CONSTRAINT "PmTask_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PmTask" ADD CONSTRAINT "PmTask_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "PmGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PmDependency" ADD CONSTRAINT "PmDependency_predecessorId_fkey" FOREIGN KEY ("predecessorId") REFERENCES "PmTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PmDependency" ADD CONSTRAINT "PmDependency_successorId_fkey" FOREIGN KEY ("successorId") REFERENCES "PmTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PmActivity" ADD CONSTRAINT "PmActivity_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "PmTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PmLegacySnapshot" ADD CONSTRAINT "PmLegacySnapshot_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PmTask" ADD CONSTRAINT "PmTask_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT;
ALTER TABLE "PmTask" ADD CONSTRAINT "PmTask_status_check" CHECK ("status" IN ('NEW', 'IN_PROGRESS', 'DONE', 'CANCELLED'));
ALTER TABLE "PmTask" ADD CONSTRAINT "PmTask_priority_check" CHECK ("priority" IN ('NORMAL', 'HIGH'));
ALTER TABLE "PmTask" ADD CONSTRAINT "PmTask_due_check" CHECK (("dueType" = 'NONE' AND "dueDate" IS NULL AND "dueAt" IS NULL) OR ("dueType" = 'DATE' AND "dueDate" IS NOT NULL AND "dueAt" IS NULL) OR ("dueType" = 'INSTANT' AND "dueDate" IS NULL AND "dueAt" IS NOT NULL));

INSERT INTO "PmGroup" (id, name, "sortOrder") VALUES
('55000000-0000-4000-8000-000000000001', 'Startnummern & Anmeldung', 0),
('55000000-0000-4000-8000-000000000002', 'Hardware', 1),
('55000000-0000-4000-8000-000000000003', 'Kommunikation', 2),
('55000000-0000-4000-8000-000000000004', 'Finanzen', 3);

CREATE FUNCTION pm_immutable_history() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'PM history is immutable'; END; $$;
CREATE TRIGGER pm_activity_immutable BEFORE UPDATE OR DELETE ON "PmActivity" FOR EACH ROW EXECUTE FUNCTION pm_immutable_history();
CREATE TRIGGER pm_snapshot_immutable BEFORE UPDATE OR DELETE ON "PmLegacySnapshot" FOR EACH ROW EXECUTE FUNCTION pm_immutable_history();

CREATE FUNCTION pm_archive_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.archived AND NOT OLD.archived THEN
    IF EXISTS (SELECT 1 FROM "PmTask" WHERE "eventId" = NEW.id AND status IN ('NEW', 'IN_PROGRESS')) THEN
      RAISE EXCEPTION 'Offene PM-Aufgaben verhindern die Archivierung';
    END IF;
    IF EXISTS (
      WITH RECURSIVE ancestors(root, predecessor) AS (
        SELECT d."successorId", d."predecessorId" FROM "PmDependency" d JOIN "PmTask" t ON t.id = d."successorId" WHERE t."eventId" = NEW.id AND t.status = 'DONE'
        UNION SELECT a.root, d."predecessorId" FROM ancestors a JOIN "PmDependency" d ON d."successorId" = a.predecessor
      ) SELECT 1 FROM ancestors a JOIN "PmTask" t ON t.id = a.predecessor WHERE t.status <> 'DONE'
    ) THEN RAISE EXCEPTION 'Ungeklärte Voraussetzungen verhindern die Archivierung'; END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER pm_event_archive BEFORE UPDATE ON "Event" FOR EACH ROW EXECUTE FUNCTION pm_archive_guard();

CREATE FUNCTION pm_legacy_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM id FROM "Event" WHERE id = NEW."eventId" FOR UPDATE;
  IF EXISTS (SELECT 1 FROM "PmTask" WHERE "eventId" = NEW."eventId") OR EXISTS (SELECT 1 FROM "PmLegacySnapshot" WHERE "eventId" = NEW."eventId") THEN
    RAISE EXCEPTION 'Legacy-Aufgaben sind nach PM-Umstellung schreibgeschützt';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER pm_legacy_write BEFORE INSERT OR UPDATE ON "EventTask" FOR EACH ROW EXECUTE FUNCTION pm_legacy_guard();
