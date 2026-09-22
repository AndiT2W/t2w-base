-- Die Notiz gilt nicht fuer das ganze Event, sondern je Detailreiter: was auf
-- der Anmeldung zu merken ist, gehoert nicht in die Stammdaten und nicht in
-- die Finanznotiz. Fuer Stammdaten, Finanz und Kontakte gab es die Spalte
-- schon ("notes", "financeNotes", "contactsNotes"); der Anmeldung fehlte sie.
ALTER TABLE "Event" ADD COLUMN "registrationNotes" TEXT;
