---
title: Internes Mehrbenutzersystem
type: task
status: ready-for-agent
updated: 2026-09-09
sources:
  - ../decisions/2026-09-09-systembenutzer-und-berechtigungen.md
---

## Problem Statement

GCW Base hat interne Benutzer, unterscheidet aber noch nicht zuverlässig zwischen normalen Benutzern und Administratoren. Dadurch können Systemeinstellungen und Verwaltungsfunktionen nicht auf berechtigte Personen begrenzt werden.

## Solution

Ein internes Benutzer- und Berechtigungssystem für genau eine Organisation mit den Rollen `Admin` und `Benutzer`. Benutzer melden sich mit E-Mail und Passwort an. Admins verwalten Einladungen, Rollen, Kontostatus und Organisationseinstellungen; beide Rollen dürfen die operativen CRM-, Event-, Rechnungs- und Auszahlungsdaten bearbeiten.

## User Stories

1. Als interner Benutzer möchte ich mich mit E-Mail und Passwort anmelden, damit mein Zugang geschützt ist.
2. Als Benutzer möchte ich mich abmelden können, damit meine Sitzung beendet wird.
3. Als Benutzer möchte ich mein Profil mit Vorname und Nachname sehen und bearbeiten können.
4. Als Benutzer möchte ich mein eigenes Passwort ändern können.
5. Als Benutzer möchte ich mein Passwort über einen zeitlich begrenzten Reset-Link zurücksetzen können.
6. Als Admin möchte ich einen neuen internen Benutzer per E-Mail einladen können.
7. Als Admin möchte ich die Rolle beim Einladen auf `Admin` oder `Benutzer` setzen können.
8. Als eingeladener Benutzer möchte ich mein Konto über einen einmaligen Aktivierungslink einrichten können.
9. Als Admin möchte ich offene Einladungen sehen, zurückziehen und erneut versenden können.
10. Als Admin möchte ich aktive, deaktivierte und eingeladene Benutzer filtern können.
11. Als Admin möchte ich Name, E-Mail-Adresse, Rolle und Status eines Benutzers verwalten können.
12. Als Admin möchte ich Benutzer deaktivieren und reaktivieren können, ohne ihre Historie zu verlieren.
13. Als Admin möchte ich die Rolle eines Benutzers sofort ändern können.
14. Als Admin möchte ich keinen zweiten Benutzer mit derselben E-Mail-Adresse anlegen können.
15. Als Admin möchte ich mich nicht selbst deaktivieren oder zum normalen Benutzer machen können.
16. Als System möchte ich den letzten aktiven Admin schützen, damit die Organisation nicht unadministrierbar wird.
17. Als Admin möchte ich Benutzer- und Systemeinstellungen nur für berechtigte Admins zugänglich machen.
18. Als Benutzer möchte ich weiterhin alle operativen Daten der Organisation sehen und bearbeiten können.
19. Als Admin möchte ich sicherheitsrelevante Benutzeränderungen im Audit-Log nachvollziehen können.
20. Als Admin möchte ich fehlgeschlagene Logins und Kontosperren sehen können.
21. Als Benutzer möchte ich bei sicherheitsrelevanten Änderungen an meinem Konto informiert werden.
22. Als Admin möchte ich den ersten Admin kontrolliert über E-Mail und Passwort aus `.env` initialisieren können.
23. Als System möchte ich Bootstrap-Werte nicht bei jedem Start überschreiben.
24. Als Benutzer möchte ich bei fünf falschen Login-Versuchen vorübergehend geschützt werden.
25. Als Admin möchte ich eine temporäre Kontosperre manuell aufheben können.

## Implementation Decisions

- Der Event-Service bleibt die zentrale Authentifizierungs- und Autorisierungsschicht.
- Der bestehende `AuthGuard` schützt alle privaten Endpunkte; Admin-Endpunkte verlangen zusätzlich eine Admin-Berechtigung.
- Der bestehende `AuthService` verwaltet Passwort-Hashing, Login, Sessions, Logout, Reset und Benutzerauflösung.
- Die Datenbank erhält bzw. nutzt Benutzer-, Session-, Einladungs- und Passwort-Reset-Daten mit einer festen Organisationsbindung.
- Benutzer besitzen eine eindeutige, normalisierte E-Mail-Adresse, Vorname, Nachname, Rolle, Status und Zeitstempel für Login und Statusänderungen.
- Rollen sind `ADMIN` und `USER`; Berechtigungen werden als einzelne serverseitige Schlüssel modelliert, auch wenn zunächst nur diese zwei Rollen existieren.
- Ein Admin ist ein vollwertiger operativer Benutzer mit zusätzlichen Verwaltungsrechten.
- Statuswerte sind `INVITED`, `ACTIVE` und `DISABLED`.
- Deaktivierte Benutzer können keinen geschützten Endpunkt verwenden. Ein angeforderter Reset darf sie nicht reaktivieren oder einen nutzbaren Link erzeugen.
- Einladungen und Reset-Links sind einmalig verwendbar und zeitlich begrenzt; Einladungen sind 48 Stunden gültig.
- Admins dürfen Passwörter direkt setzen. Ein gesetztes Passwort ist dauerhaft und wird nicht automatisch als temporär markiert.
- Nach fünf fehlgeschlagenen Logins wird ein Konto 15 Minuten gesperrt; die Sperre endet automatisch und kann durch einen Admin vorzeitig aufgehoben werden.
- Sitzungen gelten standardmäßig 8 Stunden; „angemeldet bleiben“ ist optional und höchstens 30 Tage gültig.
- Deaktivierung, Passwortwechsel, Rollenänderung und relevante Kontenänderungen widerrufen bestehende Sitzungen, soweit dies für die Aktion erforderlich ist.
- E-Mail-Änderungen benötigen eine Bestätigung der neuen Adresse. Die alte Adresse bleibt bis dahin gültig.
- E-Mail-Änderungen, Rollenänderungen, Deaktivierungen, Reaktivierungen, Einladungen, Reset-Aktionen, Logins und Sperren werden auditiert.
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
- Service-Tests prüfen Passwort-Hashing, Login-Fehler, Sperrfristen, Sessionablauf, Deaktivierung, Bootstrap-Idempotenz und Admin-Schutzregeln.
- API-Tests prüfen, dass Admin-Endpunkte ohne Admin-Berechtigung serverseitig mit einem Forbidden-Fehler abgewiesen werden.
- Vorbild sind die vorhandenen Auth-, Audit- und Einstellungs-E2E- sowie Service-Tests.

## Out of Scope

- Externe Kunden- oder Veranstalterkonten
- Mehrere Organisationen oder Mandanten
- Microsoft-/Google-SSO
- Zwei-Faktor-Authentifizierung
- Feingranulare fachliche Rollen wie Finanzen, Nur-Lesen oder Event-Verantwortlicher
- Team- oder benutzerbezogene Datenabschottung
- Öffentliche Registrierung
- Physische Löschung aktiver oder historischer Benutzer im normalen Produktbetrieb

## Further Notes

Die bestehende Annahme „alle Benutzer dürfen alles“ ist durch diese Spezifikation überholt. Die Systemrollen dürfen nicht mit Eventrollen wie `Anmeldung`, `Finanzen` oder `Timing` vermischt werden.
