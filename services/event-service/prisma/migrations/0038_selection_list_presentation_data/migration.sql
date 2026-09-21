-- Die Darstellung der Auswahllistenwerte stand bisher als feste Tabelle im
-- Frontend, nach Wertnamen: wer einen Service umbenannte, verlor sein Symbol.
-- Hier wandert sie einmalig in die Spalten, damit "UHF" sein Funksymbol
-- behaelt, und die Tabelle im Code kann entfallen.
UPDATE "ServiceOption" SET "icon" = v.icon, "color" = v.color
FROM (VALUES
  ('UHF', 'radio', 'blau'),
  ('Active', 'activity', 'tanne'),
  ('Streaming', 'radio', 'violett'),
  ('Foto', 'camera', 'amber'),
  ('Video (iRewind)', 'video', 'rot'),
  ('GPS', 'map-pin', 'amber'),
  ('Virtuell', 'panels-top-left', 'blau'),
  ('Anmeldung (only)', 'clipboard-list', 'petrol'),
  ('App', 'smartphone', 'petrol'),
  ('Jörg', 'user-round', 'beere')
) AS v(name, icon, color)
WHERE "ServiceOption"."name" = v.name AND "ServiceOption"."icon" IS NULL;

UPDATE "CommunicationChannelOption" SET "icon" = v.icon, "color" = COALESCE("color", 'graphit')
FROM (VALUES
  ('E-Mail', 'mail'),
  ('Telefon', 'phone'),
  ('Notiz', 'sticky-note'),
  ('WhatsApp', 'message-circle'),
  ('Gespräch', 'users'),
  ('Videocall', 'video')
) AS v(name, icon)
WHERE "CommunicationChannelOption"."name" = v.name AND "CommunicationChannelOption"."icon" IS NULL;

-- Die zwanzig Farbnamen der alten Liste auf die acht geprueften abbilden.
-- Betrifft alle sieben Auswahllisten.
DO $$
DECLARE
  tabelle TEXT;
BEGIN
  FOREACH tabelle IN ARRAY ARRAY[
    'Sport', 'ServiceOption', 'HardwareObjectOption',
    'CommunicationChannelOption', 'CommunicationTopicOption', 'EventRoleOption', 'PmGroup'
  ] LOOP
    EXECUTE format($f$
      UPDATE %I SET "color" = CASE "color"
        WHEN 'emerald' THEN 'tanne'  WHEN 'green'   THEN 'tanne'  WHEN 'lime'    THEN 'tanne'
        WHEN 'sky'     THEN 'blau'   WHEN 'blue'    THEN 'blau'   WHEN 'indigo'  THEN 'blau'
        WHEN 'violet'  THEN 'violett' WHEN 'purple' THEN 'violett'
        WHEN 'amber'   THEN 'amber'  WHEN 'yellow'  THEN 'amber'  WHEN 'orange'  THEN 'amber'
        WHEN 'rose'    THEN 'rot'    WHEN 'red'     THEN 'rot'
        WHEN 'teal'    THEN 'petrol' WHEN 'cyan'    THEN 'petrol'
        WHEN 'fuchsia' THEN 'beere'  WHEN 'pink'    THEN 'beere'
        WHEN 'slate'   THEN 'graphit' WHEN 'stone'  THEN 'graphit' WHEN 'neutral' THEN 'graphit'
        ELSE "color" END
      WHERE "color" IS NOT NULL
    $f$, tabelle);
  END LOOP;
END $$;
