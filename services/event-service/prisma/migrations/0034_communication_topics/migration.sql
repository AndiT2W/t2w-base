-- Bezug einer Nachricht: neben der Person kann ein Thema stehen, etwa
-- "Teilnehmer" fuer Sammelmails ohne einzelnen Ansprechpartner.
-- Ein Eintrag traegt genau ein Thema (Nutzerentscheidung vom 19.09.2026).
CREATE TABLE "CommunicationTopicOption" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "icon" TEXT,
  "color" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CommunicationTopicOption_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CommunicationTopicOption_name_key" ON "CommunicationTopicOption"("name");

INSERT INTO "CommunicationTopicOption" ("id", "name", "icon", "color", "sortOrder", "updatedAt")
VALUES
  (gen_random_uuid(), 'Teilnehmer', 'users', 'sky', 0, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Sponsoren', 'star', 'amber', 1, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Behörde', 'clipboard-list', 'slate', 2, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Rechnung', 'euro', 'emerald', 3, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Presse', 'camera', 'violet', 4, CURRENT_TIMESTAMP);

-- Zuordnung am Eintrag. ON DELETE SET NULL: ein geloeschtes Thema darf keine
-- Nachricht mitreissen, der Eintrag verliert nur seinen Bezug.
ALTER TABLE "EventActivity"
  ADD COLUMN "topicId" UUID;
ALTER TABLE "EventCommunicationMessage"
  ADD COLUMN "topicId" UUID;

ALTER TABLE "EventActivity"
  ADD CONSTRAINT "EventActivity_topicId_fkey" FOREIGN KEY ("topicId")
  REFERENCES "CommunicationTopicOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EventCommunicationMessage"
  ADD CONSTRAINT "EventCommunicationMessage_topicId_fkey" FOREIGN KEY ("topicId")
  REFERENCES "CommunicationTopicOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "EventActivity_topicId_idx" ON "EventActivity"("topicId");
CREATE INDEX "EventCommunicationMessage_topicId_idx" ON "EventCommunicationMessage"("topicId");
