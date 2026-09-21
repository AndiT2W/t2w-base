-- Optimistische Sperre fuer alle Auswahllisten.  Bisher hatte nur PmGroup
-- eine `version`; mit einer gemeinsamen Pflegemaske waeren das zwei
-- Verhalten bei gleichzeitiger Bearbeitung: mal eine Warnung, mal ein
-- stilles Ueberschreiben.
ALTER TABLE "Sport" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "ServiceOption" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "HardwareObjectOption" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "CommunicationChannelOption" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "CommunicationTopicOption" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "EventRoleOption" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
