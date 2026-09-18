---
title: Systembenutzer und Berechtigungen
type: decision
status: accepted
updated: 2026-09-18
sources:
  - user conversation 2026-09-09
  - user conversation 2026-09-18
---

# Systembenutzer und Berechtigungen

## Anlass

GCW Base soll mehrere interne Benutzer unterstützen und zwischen Administratoren und normalen Benutzern unterscheiden. Zusätzlich sollen Veranstalter über einen klar begrenzten externen Zugang an persönlich zugewiesenen Eventaufgaben mitarbeiten. Das bisherige MVP-Modell („alle Benutzer dürfen alles“) ist damit überholt; die bestehende Eventrollen-Logik bleibt davon getrennt.

## Vereinbartes Modell

- Ein Benutzerkonto ist ein Login mit Name, E-Mail, Status und letztem Login.
- Eine Systemrolle bündelt die grundsätzliche Zugriffsart. Es gibt `Admin`, `Benutzer` und `Veranstalter`.
- Berechtigungen werden serverseitig geprüft; ausgeblendete Menüpunkte sind nur Komfort, keine Sicherheit.
- `Admin` darf Benutzer einladen, Rollen ändern, deaktivieren und Systemeinstellungen verwalten.
- `User` darf die normalen CRM-, Event- und operativen Arbeitsabläufe verwenden, aber keine Benutzer- oder Systemeinstellungen ändern.
- Finanzzugriff ist keine zusätzliche Rolle. Bei normalen Benutzern wird er über die eigenständige Berechtigung `Finanzen sehen` ein- oder ausgeschaltet.
- Admins besitzen Finanzzugriff immer; er kann bei ihnen nicht abgeschaltet werden.
- Ohne Finanzzugriff bleiben Angebote, Rechnungen, Gutschriften, Zahlungen und Auszahlungen einschließlich Dokumenten, Beträgen, Kennzahlen und Exporten verborgen und serverseitig gesperrt. Die rein operative Zuordnung eines Rechnungsempfängers bleibt sichtbar, solange dabei keine geschützten Rechnungs- oder Betragsdaten offengelegt werden.
- Neue normale Benutzer erhalten standardmäßig keinen Finanzzugriff. Der Zugriff kann beim Einladen oder später in der Benutzerverwaltung gesetzt werden.
- `Veranstalter` ist eine externe Systemrolle. Jedes Veranstalterkonto ist genau einem Veranstalter-Stammsatz zugeordnet und besitzt niemals Finanzzugriff.
- Ein Veranstalter sieht nur Eventaufgaben, die seinem persönlichen Konto ausdrücklich zugewiesen sind. Die bloße Zuordnung seines Veranstalter-Stammsatzes zu einem Event gewährt keinen Zugriff.
- Veranstalter dürfen bei zugewiesenen Aufgaben lesen, den gemeinsamen Kommentarverlauf verwenden und Dateien hochladen. Status und andere Aufgabenfelder dürfen sie derzeit nicht ändern.
- Globale Aufgaben, Aufgaben fremder Veranstalter und alle übrigen internen Module bleiben für Veranstalter gesperrt. Neuzuweisung, Deaktivierung oder Aufhebung der Veranstalterverknüpfung beendet den Zugriff sofort, ohne die beigetragenen Kommentare oder Dateien zu löschen.
- Benutzer werden deaktiviert statt gelöscht, damit Audit-Log, Autorenschaft und historische Dokumente erhalten bleiben.
- Einladungen laufen über einen einmalig verwendbaren, zeitlich begrenzten Link. Passwort-Reset und Session-Widerruf gehören zur Kontoverwaltung.
- Kritische Änderungen an Benutzern, Rollen und Einstellungen werden im unveränderlichen Audit-Log protokolliert.

## Verwaltung im Produkt

Unter `Einstellungen → Benutzer & Berechtigungen` sieht ein Admin eine Tabelle mit Name, E-Mail, Rolle, gegebenenfalls verknüpftem Veranstalter, Finanzzugriff, Status und letztem Login. Dort kann er Benutzer einladen, eine Rolle oder das Häkchen `Finanzen sehen` ändern, Veranstalterkonten zuordnen, den Zugang deaktivieren/reaktivieren und ausstehende Einladungen zurückziehen oder erneut senden. Bei Admins ist das Finanz-Häkchen gesetzt und nicht bearbeitbar; bei Veranstaltern ist es ausgeschaltet und nicht bearbeitbar.

## Offene Erweiterungen

Weitere Rollen oder feinere Berechtigungen (z. B. ein allgemeiner Nur-Lesen-Zugang) sollten erst aus konkreten Arbeitsabläufen entstehen. Eventrollen wie `Anmeldung`, `Finanzen` und `Timing` beschreiben weiterhin die Funktion eines Kontakts bei einem Event und sind keine Login-Berechtigungen. Die Eventrolle `Finanzen` gewährt insbesondere keinen Zugriff auf Finanzmodule; der Veranstalter-Stammsatz allein gewährt keinen Login- oder Aufgabenzugriff.

## Evidenz

- User conversation, 2026-09-09.
- User conversation, 2026-09-18.
- [Person, Kundenprofil und Eventrollen](2026-08-21-person-kundenprofil-und-eventrollen.md) für die Abgrenzung fachlicher Eventrollen.
- [Invoice MVP spec](../tasks/invoice-mvp-spec.md) dokumentiert das bisherige Modell ohne Rollen.
