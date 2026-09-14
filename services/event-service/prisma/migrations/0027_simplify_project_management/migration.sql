-- The approved v4 model deliberately starts the new PM workspace without carrying
-- forward task content, comments, activity records or dependency graphs.
ALTER TABLE "PmActivity" DISABLE TRIGGER pm_activity_immutable;
DELETE FROM "PmActivity";
DELETE FROM "PmDependency";
DELETE FROM "PmTask";

ALTER TABLE "PmTask" DROP CONSTRAINT "PmTask_due_check";
ALTER TABLE "PmTask" DROP CONSTRAINT "PmTask_status_check";
ALTER TABLE "PmTask" DROP CONSTRAINT "PmTask_priority_check";
ALTER TABLE "PmTask" DROP CONSTRAINT "PmTask_eventId_fkey";
ALTER TABLE "PmTask" ALTER COLUMN "eventId" DROP NOT NULL;
ALTER TABLE "PmTask" ADD COLUMN "scope" TEXT NOT NULL DEFAULT 'EVENT';
ALTER TABLE "PmTask" ADD COLUMN "description" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PmTask" ADD COLUMN "startDate" TEXT;
ALTER TABLE "PmTask" ADD COLUMN "endDate" TEXT;
ALTER TABLE "PmTask" DROP COLUMN "references";
ALTER TABLE "PmTask" DROP COLUMN "nextStep";
ALTER TABLE "PmTask" DROP COLUMN "result";
ALTER TABLE "PmTask" DROP COLUMN "reason";
ALTER TABLE "PmTask" DROP COLUMN "dueType";
ALTER TABLE "PmTask" DROP COLUMN "dueDate";
ALTER TABLE "PmTask" DROP COLUMN "dueAt";
ALTER TABLE "PmTask" ALTER COLUMN "status" SET DEFAULT 'OPEN';
ALTER TABLE "PmTask" ALTER COLUMN "priority" SET DEFAULT 'NORMAL';
ALTER TABLE "PmTask" ADD CONSTRAINT "PmTask_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PmTask" ADD CONSTRAINT "PmTask_scope_check" CHECK ((scope = 'EVENT' AND "eventId" IS NOT NULL) OR (scope = 'GLOBAL' AND "eventId" IS NULL));
ALTER TABLE "PmTask" ADD CONSTRAINT "PmTask_status_check" CHECK (status IN ('OPEN', 'IN_PROGRESS', 'DONE'));
ALTER TABLE "PmTask" ADD CONSTRAINT "PmTask_priority_check" CHECK (priority IN ('LOW', 'NORMAL', 'HIGH'));
ALTER TABLE "PmTask" ADD CONSTRAINT "PmTask_dates_check" CHECK ("startDate" IS NULL OR "endDate" IS NULL OR "startDate" <= "endDate");
CREATE INDEX "PmTask_scope_id_idx" ON "PmTask"(scope, id);

CREATE TABLE "PmComment" (
  "id" UUID NOT NULL,
  "taskId" UUID NOT NULL,
  "authorId" UUID NOT NULL,
  "text" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PmComment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PmComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "PmTask"("id") ON DELETE CASCADE
);
CREATE INDEX "PmComment_taskId_createdAt_idx" ON "PmComment"("taskId", "createdAt");

ALTER TABLE "PmActivity" DROP CONSTRAINT "PmActivity_taskId_fkey";
ALTER TABLE "PmActivity" ADD CONSTRAINT "PmActivity_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "PmTask"("id") ON DELETE CASCADE;
DROP TRIGGER IF EXISTS pm_activity_immutable ON "PmActivity";

CREATE OR REPLACE FUNCTION pm_archive_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.archived AND NOT OLD.archived THEN
    IF EXISTS (SELECT 1 FROM "PmTask" WHERE "eventId" = NEW.id AND status IN ('OPEN', 'IN_PROGRESS')) THEN
      RAISE EXCEPTION 'Offene PM-Aufgaben verhindern die Archivierung';
    END IF;
  END IF;
  RETURN NEW;
END; $$;
