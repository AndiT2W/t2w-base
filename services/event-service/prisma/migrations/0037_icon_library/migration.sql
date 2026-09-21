-- Symbolbibliothek: hochgeladene Symbole liegen wie die Aufgabenanhaenge als
-- Bytes in der Datenbank, nicht im Dateisystem. Benutzte Symbole werden
-- archiviert, nie geloescht -- dieselbe Regel wie "inaktiv" bei den
-- Auswahllistenwerten selbst.
CREATE TABLE "IconAsset" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "content" BYTEA NOT NULL,
  "monochrome" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdById" UUID NOT NULL,
  CONSTRAINT "IconAsset_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "IconAsset"
  ADD CONSTRAINT "IconAsset_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "IconAsset_active_name_idx" ON "IconAsset"("active", "name");
