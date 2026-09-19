-- Nachrichtenarten der Kommunikationsanzeige werden konfigurierbar.
-- Die drei bisher fest verdrahteten Werte werden als Optionen vorbelegt,
-- damit bestehende Eintraege ihre Art behalten.
CREATE TABLE "CommunicationChannelOption" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "icon" TEXT,
  "color" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CommunicationChannelOption_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CommunicationChannelOption_name_key" ON "CommunicationChannelOption"("name");

INSERT INTO "CommunicationChannelOption" ("id", "name", "icon", "color", "sortOrder", "updatedAt")
VALUES
  (gen_random_uuid(), 'E-Mail', 'mail', 'slate', 0, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Telefon', 'phone', 'slate', 1, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Notiz', 'sticky-note', 'slate', 2, CURRENT_TIMESTAMP);

-- Weitere Arten aus dem Entwurf stehen bereit, bleiben aber inaktiv, bis sie
-- gebraucht werden: so taucht nichts unaufgefordert in den Filtern auf.
INSERT INTO "CommunicationChannelOption" ("id", "name", "icon", "color", "sortOrder", "active", "updatedAt")
VALUES
  (gen_random_uuid(), 'WhatsApp', 'message-circle', 'slate', 3, false, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Gespräch', 'users', 'slate', 4, false, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'Videocall', 'video', 'slate', 5, false, CURRENT_TIMESTAMP);
