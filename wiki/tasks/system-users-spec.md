---
title: Benutzerkonten und Veranstalterzugang
type: task
status: complete
updated: 2026-09-18
sources:
  - ../decisions/2026-09-09-systembenutzer-und-berechtigungen.md
---

## Problem Statement

GCW Base hat interne Benutzer, unterscheidet aber noch nicht zuverlässig zwischen normalen Benutzern und Administratoren. Außerdem fehlt ein sicher begrenzter Zugang für Veranstalter, die an ihnen zugewiesenen Aufgaben mitarbeiten sollen. Dadurch können Systemeinstellungen, Verwaltungsfunktionen, sensible Finanzdaten und externe Aufgabeninhalte nicht verlässlich auf berechtigte Personen begrenzt werden.

## Solution

Ein Benutzer- und Berechtigungssystem für genau eine interne Organisation mit den Rollen `Admin`, `Benutzer` und `Veranstalter`. Alle Konten melden sich mit E-Mail und Passwort an. Admins verwalten Einladungen, Rollen, Kontostatus, Organisationseinstellungen und den benutzerbezogenen Schalter `Finanzen sehen`. Admins besitzen immer Finanzzugriff; normale interne Benutzer sehen Finanzmodule und geschützte Finanzdaten nur bei gesetztem Schalter. Veranstalterkonten sind mit einem Veranstalter-Stammsatz verbunden und sehen ausschließlich Eventaufgaben, die ihrem eigenen Konto ausdrücklich zugewiesen wurden. Dort dürfen sie lesen, kommentieren und Dateien hochladen, derzeit aber weder Status noch andere Aufgabenfelder ändern.

## Implementierungsstand

Issue #49 ist seit 2026-09-18 lokal umgesetzt. Migration `0031_user_access_and_task_attachments` erweitert Konten, Einladungen, Reset-/Bestätigungstoken, Sicherheitsbenachrichtigungen und Aufgabenanhänge. Die Oberfläche enthält Anmeldung, Profil und Admin-Benutzerverwaltung; Rollen-, Finanz- und Objektgrenzen werden zusätzlich serverseitig erzwungen. Veranstalter erhalten ausschließlich persönlich zugewiesene Eventaufgaben mit Kommentar- und Uploadrecht. Unit-, Service-, Integrations- und zwei reale Browserregressionen sichern Login-Sperre, Sessionablauf, Adminschutz, Finanzfreigabe, direkte URLs/API-Aufrufe sowie Veranstalter-Kommentare und -Dateien mit Reload ab.

## User Stories

1. Als interner Benutzer möchte ich mich mit E-Mail und Passwort anmelden, damit mein Zugang geschützt ist.
2. Als Benutzer möchte ich mich abmelden können, damit meine Sitzung beendet wird.
3. Als Benutzer möchte ich mein Profil mit Vorname und Nachname sehen und bearbeiten können.
4. Als Benutzer möchte ich mein eigenes Passwort ändern können.
5. Als Benutzer möchte ich mein Passwort über einen zeitlich begrenzten Reset-Link zurücksetzen können.
6. Als Admin möchte ich einen neuen internen Benutzer per E-Mail einladen können.
7. Als Admin möchte ich die Rolle beim Einladen auf `Admin`, `Benutzer` oder `Veranstalter` setzen können.
8. Als eingeladener Benutzer möchte ich mein Konto über einen einmaligen Aktivierungslink einrichten können.
9. Als Admin möchte ich offene Einladungen sehen, zurückziehen und erneut versenden können.
10. Als Admin möchte ich aktive, deaktivierte und eingeladene Benutzer filtern können.
11. Als Admin möchte ich Name, E-Mail-Adresse, Rolle, gegebenenfalls Veranstalterverknüpfung und Status eines Benutzers verwalten können.
12. Als Admin möchte ich Benutzer deaktivieren und reaktivieren können, ohne ihre Historie zu verlieren.
13. Als Admin möchte ich die Rolle eines Benutzers sofort ändern können.
14. Als Admin möchte ich keinen zweiten Benutzer mit derselben E-Mail-Adresse anlegen können.
15. Als Admin möchte ich mich nicht selbst deaktivieren oder zum normalen Benutzer machen können.
16. Als System möchte ich den letzten aktiven Admin schützen, damit die Organisation nicht unadministrierbar wird.
17. Als Admin möchte ich Benutzer- und Systemeinstellungen nur für berechtigte Admins zugänglich machen.
18. Als Admin möchte ich beim Einladen und Bearbeiten eines normalen Benutzers über das Häkchen `Finanzen sehen` festlegen können, ob dieser Finanzzugriff erhält.
19. Als Admin möchte ich immer vollständigen Finanzzugriff haben; dieser Zugriff darf bei Admin-Konten nicht abgeschaltet werden.
20. Als Benutzer mit Finanzzugriff möchte ich Angebote, Rechnungen, Gutschriften, Zahlungen und Auszahlungen samt zugehörigen Dokumenten, Beträgen und Exporten sehen können.
21. Als Benutzer ohne Finanzzugriff möchte ich keine Finanznavigation und keine geschützten Finanzdaten sehen; auch direkte URLs oder API-Aufrufe dürfen keinen Zugriff ermöglichen.
22. Als interner Benutzer möchte ich weiterhin alle für mich freigegebenen operativen Daten der Organisation sehen und bearbeiten können.
23. Als Admin möchte ich sicherheitsrelevante Benutzer- und Berechtigungsänderungen im Audit-Log nachvollziehen können.
24. Als Admin möchte ich fehlgeschlagene Logins und Kontosperren sehen können.
25. Als Benutzer möchte ich bei sicherheitsrelevanten Änderungen an meinem Konto informiert werden.
26. Als Admin möchte ich den ersten Admin kontrolliert über E-Mail und Passwort aus `.env` initialisieren können.
27. Als System möchte ich Bootstrap-Werte nicht bei jedem Start überschreiben.
28. Als Benutzer möchte ich bei fünf falschen Login-Versuchen vorübergehend geschützt werden.
29. Als Admin möchte ich eine temporäre Kontosperre manuell aufheben können.
30. Als Admin möchte ich ein Veranstalterkonto einladen und genau einem Veranstalter-Stammsatz zuordnen können.
31. Als Admin oder interner Benutzer möchte ich eine Eventaufgabe einem Veranstalterkonto dieses Events zuweisen können.
32. Als Veranstalter möchte ich nach der Anmeldung ausschließlich die mir persönlich zugewiesenen Eventaufgaben mit dem minimal erforderlichen Eventkontext sehen.
33. Als Veranstalter möchte ich die Kommentare und Dateien einer mir zugewiesenen Aufgabe sehen und eigene Kommentare erstellen, bearbeiten und löschen können.
34. Als Veranstalter möchte ich Dateien zu einer mir zugewiesenen Aufgabe hochladen und nach einem Reload weiterhin sehen können.
35. Als Veranstalter möchte ich Status, Titel, Beschreibung, Priorität, Termine, Kategorie, Zuweisung und Abhängigkeiten einer Aufgabe nicht ändern können.
36. Als Veranstalter möchte ich keine globalen Aufgaben, nicht zugewiesenen Eventaufgaben, anderen Events, Stammdaten, Finanzdaten, Einstellungen oder Auditdaten sehen können.
37. Als System möchte ich den Veranstalterzugriff sofort entziehen, wenn eine Aufgabe neu zugewiesen, das Konto deaktiviert oder die Veranstalterverknüpfung aufgehoben wird; bestehende Kommentare und Dateien bleiben dabei nachvollziehbar erhalten.
38. Als interner Benutzer möchte ich vor der Zuweisung einer bereits kommentierten Aufgabe erkennen, dass deren bisheriger Aufgabeninhalt, Kommentare und Dateien für den Veranstalter sichtbar werden.

## Implementation Decisions

- Der Event-Service bleibt die zentrale Authentifizierungs- und Autorisierungsschicht.
- Der bestehende `AuthGuard` schützt alle privaten Endpunkte; Admin-Endpunkte verlangen zusätzlich eine Admin-Berechtigung.
- Der bestehende `AuthService` verwaltet Passwort-Hashing, Login, Sessions, Logout, Reset und Benutzerauflösung.
- Die Datenbank erhält bzw. nutzt Benutzer-, Session-, Einladungs- und Passwort-Reset-Daten mit einer festen Organisationsbindung.
- Benutzer besitzen eine eindeutige, normalisierte E-Mail-Adresse, Vorname, Nachname, Rolle, Status und Zeitstempel für Login und Statusänderungen.
- Rollen sind `ADMIN`, `USER` und `ORGANIZER`; die Implementierung gleicht dabei die bestehende Codebezeichnung `MITARBEITER` kontrolliert an. `ADMIN` und `USER` sind interne Rollen, `ORGANIZER` wird in der Oberfläche als `Veranstalter` bezeichnet und ist ein externer, stark eingeschränkter Zugang.
- Ein Admin ist ein vollwertiger operativer Benutzer mit zusätzlichen Verwaltungsrechten.
- Finanzzugriff ist keine dritte Rolle, sondern die einzelne Benutzerberechtigung `FINANCE_VIEW`, die in der Verwaltung als Häkchen `Finanzen sehen` dargestellt wird.
- `ADMIN` besitzt `FINANCE_VIEW` immer implizit. Das Häkchen ist bei Admins gesetzt und nicht abschaltbar.
- Bei normalen Benutzern ist `FINANCE_VIEW` standardmäßig nicht gesetzt und kann beim Einladen sowie später in der Benutzerverwaltung geändert werden.
- `FINANCE_VIEW` schützt in V1 Angebote, Rechnungen, Gutschriften, Zahlungen und Auszahlungen einschließlich Dokumenten, Geldbeträgen, Kennzahlen und Exporten. Die rein operative Zuordnung eines Rechnungsempfängers in den Event-Stammdaten bleibt davon unberührt, solange dort keine geschützten Rechnungs- oder Betragsdaten ausgegeben werden.
- Der Server prüft `FINANCE_VIEW` für alle betroffenen Lese-, Schreib- und Export-Endpunkte. Ausgeblendete Navigation und gesperrte Routen ergänzen diese Prüfung nur in der Oberfläche; direkte URLs und API-Aufrufe dürfen sie nicht umgehen.
- Allgemeine Endpunkte und Suchergebnisse dürfen geschützte Finanzdaten nicht als eingebettete Nebenfelder an Benutzer ohne `FINANCE_VIEW` ausliefern.
- Ein `ORGANIZER`-Konto ist genau einem aktiven Veranstalter-Stammsatz zugeordnet. Mehrere persönliche Konten dürfen demselben Veranstalter zugeordnet sein; Aufgaben werden trotzdem immer einem konkreten Konto und nicht pauschal der Organisation zugewiesen.
- Veranstalterkonten erhalten niemals `FINANCE_VIEW` und können nicht zu Admins oder internen Benutzern hochgestuft werden, ohne dass die externe Veranstalterverknüpfung kontrolliert entfernt wird.
- Nur Eventaufgaben dürfen einem Veranstalterkonto zugewiesen werden. Das Konto muss zum Veranstalter des betreffenden Events gehören; globale Aufgaben und Aufgaben fremder Veranstalter sind als Zuweisung unzulässig.
- Der bestehende Aufgaben-Owner bleibt die konkrete verantwortliche Person. Die Aufgabenabfrage eines Veranstalters erzwingt serverseitig zugleich `ownerId = angemeldetes Konto`, Eventbezug und passende Veranstalterverknüpfung; vom Client übergebene IDs erweitern den Zugriff nie.
- Ein Veranstalter darf bei zugewiesenen Aufgaben Titel, Beschreibung, Priorität, Status, Termine, Kategorie, Owner und Abhängigkeiten nur lesen. Er darf weder Aufgaben anlegen oder löschen noch diese Felder verändern oder Aufgaben abschließen.
- Nicht zugewiesene Vorgänger oder Nachfolger dürfen dabei nicht offengelegt werden. Für sie sieht der Veranstalter höchstens einen abgeleiteten Hinweis wie `Blockiert`; Details und Links erscheinen nur, wenn auch die referenzierte Aufgabe demselben Konto zugewiesen ist.
- Ein Veranstalter darf den gemeinsamen Kommentarverlauf der zugewiesenen Aufgabe lesen, neue Kommentare schreiben und ausschließlich eigene Kommentare bearbeiten oder löschen. Aufgabenaktivität und internes Audit-Log bleiben verborgen.
- Aufgabenbezogene Dateien werden als eigene Anhänge der Aufgabe gespeichert und übernehmen deren Autorisierung. Veranstalter dürfen Anhänge der zugewiesenen Aufgabe lesen und neue hochladen, aber keine vorhandenen Dateien löschen oder ersetzen.
- Aufgabenanhänge werden privat gespeichert und nur nach erneuter serverseitiger Aufgabenautorisierung ausgeliefert. Dateiname, Größe und erlaubte Dateitypen werden validiert; ein öffentlicher oder erratbarer Download-Link darf die Zugriffsprüfung nicht umgehen.
- Wird eine Aufgabe einem Veranstalter zugewiesen, werden ihr Aufgabeninhalt sowie vorhandene Kommentare und Aufgabenanhänge für dieses Konto sichtbar. Die Oberfläche weist interne Benutzer vor der ersten externen Zuweisung darauf hin.
- Eine Neuzuweisung oder Deaktivierung entzieht den Zugriff unmittelbar, auch bei direkter URL oder laufender Sitzung. Vom Veranstalter erstellte Kommentare und Dateien bleiben mit Autor und Zeitstempel erhalten.
- Ein Veranstalter sieht in seiner Aufgabenansicht nur den minimalen Eventkontext: Eventcode, Eventname und Zeitraum. Andere Eventdetails, Kontakte, Kommunikation, Dateien, Hardware, Auszahlungen, Angebote und Rechnungen bleiben gesperrt.
- Statuswerte sind `INVITED`, `ACTIVE` und `DISABLED`.
- Deaktivierte Benutzer können keinen geschützten Endpunkt verwenden. Ein angeforderter Reset darf sie nicht reaktivieren oder einen nutzbaren Link erzeugen.
- Einladungen und Reset-Links sind einmalig verwendbar und zeitlich begrenzt; Einladungen sind 48 Stunden gültig.
- Admins dürfen Passwörter direkt setzen. Ein gesetztes Passwort ist dauerhaft und wird nicht automatisch als temporär markiert.
- Nach fünf fehlgeschlagenen Logins wird ein Konto 15 Minuten gesperrt; die Sperre endet automatisch und kann durch einen Admin vorzeitig aufgehoben werden.
- Sitzungen gelten standardmäßig 8 Stunden; „angemeldet bleiben“ ist optional und höchstens 30 Tage gültig.
- Deaktivierung, Passwortwechsel, Rollenänderung und relevante Kontenänderungen widerrufen bestehende Sitzungen, soweit dies für die Aktion erforderlich ist.
- E-Mail-Änderungen benötigen eine Bestätigung der neuen Adresse. Die alte Adresse bleibt bis dahin gültig.
- E-Mail-Änderungen, Rollen-, Veranstalterverknüpfungs- und Finanzberechtigungsänderungen, Deaktivierungen, Reaktivierungen, Einladungen, Reset-Aktionen, Logins und Sperren werden auditiert.
- Audit-Einträge speichern Benutzer-ID sowie Name und E-Mail als Snapshot; Passwörter, Hashes und Tokens werden nie gespeichert.
- Das Audit-Log ist nur für Admins sichtbar; normale Benutzer sehen keine vollständige Systemhistorie.
- Sicherheits-E-Mails werden zentral über die bestehende Mail-Konfiguration versendet. Login-E-Mails werden nicht bei jedem Login verschickt.
- Der erste Admin wird über eine `.env`-E-Mail und ein `.env`-Passwort gebootstrapped. Bestehende Benutzer werden nicht überschrieben; der Bootstrap ist idempotent und nicht als laufender zweiter Login-Mechanismus gedacht.
- Die einzige Organisation ist im Datenmodell explizit referenziert; es gibt zunächst keine Organisationsauswahl und keine Mandantenverwaltung.
- Fachliche Eventrollen bleiben von Systemrollen getrennt.

## Testing Decisions

- Tests prüfen ausschließlich beobachtbares Verhalten, nicht Prisma- oder Controller-Implementierungsdetails.
- Die zentrale Regression ist eine Browser-E2E-Suite über Login, Einladung/Aktivierung, Rollenwechsel, geschützte Einstellungen, Deaktivierung und Persistenz nach Reload.
- Die E2E-Suite prüft, dass Benutzer operative Daten verwenden können, aber Benutzerverwaltung und Audit-Log nicht öffnen dürfen.
- Die E2E-Suite prüft den Finanzzugriff vor und nach einer Änderung des Häkchens, einschließlich Navigation, direkter URL, Reload und mindestens einer Rechnung sowie einer Auszahlung.
- API-Tests prüfen, dass ein Benutzer ohne `FINANCE_VIEW` Finanz-Endpunkte weder lesen noch ändern oder exportieren kann und keine Finanzdaten über allgemeine Endpunkte erhält.
- Tests prüfen, dass Admins unabhängig von gespeicherten Einzelberechtigungen immer vollständigen Finanzzugriff besitzen und dieser in der Benutzerverwaltung nicht abgeschaltet werden kann.
- Eine Browser-E2E-Regression meldet sich als Veranstalter an, zeigt ausschließlich eine persönlich zugewiesene Eventaufgabe, erstellt einen Kommentar, lädt eine Datei hoch und prüft beides nach Reload.
- Dieselbe Regression prüft, dass Status und sämtliche Aufgabenfelder nicht bearbeitbar sind und dass globale, fremde sowie nicht zugewiesene Aufgaben und interne Navigation fehlen.
- API-Tests erzwingen die Objektgrenze gegen erratene Task-, Kommentar- und Datei-IDs und erwarten für fremde Ressourcen keinen Datenabfluss.
- Projektionstests prüfen, dass Abhängigkeiten zu nicht zugewiesenen Aufgaben nur als abgeleiteter Blockadehinweis und ohne Titel, ID oder Link erscheinen.
- Service-Tests verbieten Veranstalterzuweisungen bei globalen Aufgaben, fremden Veranstaltern oder aufgehobener Veranstalterverknüpfung und entziehen Zugriff nach Neuzuweisung beziehungsweise Deaktivierung sofort.
- Tests prüfen, dass Veranstalter nur eigene Kommentare ändern oder löschen, Dateien nur hinzufügen und weder Aufgabenfelder noch Status oder Zuweisung mutieren können.
- Upload-Tests prüfen Größen- und Typgrenzen sowie den autorisierten Download; ein ehemaliger oder fremder Owner darf auch mit bekannter Anhangs-ID nicht zugreifen.
- Service-Tests prüfen Passwort-Hashing, Login-Fehler, Sperrfristen, Sessionablauf, Deaktivierung, Bootstrap-Idempotenz und Admin-Schutzregeln.
- API-Tests prüfen, dass Admin-Endpunkte ohne Admin-Berechtigung serverseitig mit einem Forbidden-Fehler abgewiesen werden.
- Vorbild sind die vorhandenen Auth-, Audit- und Einstellungs-E2E- sowie Service-Tests.

## Out of Scope

- Andere externe Kundenkonten sowie veranstalterweiter Zugriff ohne konkrete Aufgabenzuweisung
- Mehrere Organisationen oder Mandanten
- Microsoft-/Google-SSO
- Zwei-Faktor-Authentifizierung
- Weitere feingranulare Berechtigungen wie Nur-Lesen oder Event-Verantwortlicher
- Allgemeine Team- oder benutzerbezogene Datenabschottung außerhalb des ausdrücklich definierten Veranstalter-Aufgabenzugriffs
- Öffentliche Registrierung
- Physische Löschung aktiver oder historischer Benutzer im normalen Produktbetrieb

## Further Notes

Die bestehende Annahme „alle Benutzer dürfen alles“ ist durch diese Spezifikation überholt. `Finanzen sehen` ist eine Benutzerberechtigung und keine Systemrolle. Die Systemrolle `Veranstalter` bezeichnet ein externes Login und darf nicht mit dem Veranstalter-Stammsatz oder einer fachlichen Eventrolle verwechselt werden. Andere Systemrollen und Berechtigungen dürfen ebenfalls nicht mit Eventrollen wie `Anmeldung`, `Finanzen` oder `Timing` vermischt werden.
