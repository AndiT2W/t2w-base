ALTER TABLE "ServiceOption" ADD COLUMN "icon" TEXT, ADD COLUMN "color" TEXT;

UPDATE "ServiceOption"
SET "icon" = CASE "name"
  WHEN 'UHF' THEN 'radio' WHEN 'Active' THEN 'activity' WHEN 'Streaming' THEN 'radio' WHEN 'Foto' THEN 'camera' WHEN 'Video (iRewind)' THEN 'video' WHEN 'GPS' THEN 'map-pin' WHEN 'Virtuell' THEN 'panels-top-left' WHEN 'Anmeldung (only)' THEN 'clipboard-list' WHEN 'App' THEN 'smartphone' WHEN 'Jörg' THEN 'user-round' END,
  "color" = CASE "name"
  WHEN 'UHF' THEN 'sky' WHEN 'Active' THEN 'lime' WHEN 'Streaming' THEN 'violet' WHEN 'Foto' THEN 'amber' WHEN 'Video (iRewind)' THEN 'rose' WHEN 'GPS' THEN 'orange' WHEN 'Virtuell' THEN 'indigo' WHEN 'Anmeldung (only)' THEN 'teal' WHEN 'App' THEN 'cyan' WHEN 'Jörg' THEN 'fuchsia' END
WHERE "name" IN ('UHF', 'Active', 'Streaming', 'Foto', 'Video (iRewind)', 'GPS', 'Virtuell', 'Anmeldung (only)', 'App', 'Jörg');
