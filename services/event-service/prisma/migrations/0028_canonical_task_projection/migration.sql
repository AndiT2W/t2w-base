-- The user explicitly chose a hard cutover: legacy EventTask data is not migrated.
DROP TRIGGER IF EXISTS pm_legacy_write ON "EventTask";
DROP FUNCTION IF EXISTS pm_legacy_guard();
DROP TABLE "EventTask";
