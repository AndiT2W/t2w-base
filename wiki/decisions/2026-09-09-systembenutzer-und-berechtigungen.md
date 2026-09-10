---
title: Systembenutzer und Berechtigungen
type: decision
status: accepted
updated: 2026-09-09
sources:
  - user conversation 2026-09-09
---

# Systembenutzer und Berechtigungen

## Anlass

GCW Base soll mehrere interne Benutzer unterstützen und zwischen Administratoren und normalen Benutzern unterscheiden. Das bisherige MVP-Modell („alle Benutzer dürfen alles“) ist damit überholt; die bestehende Eventrollen-Logik bleibt davon getrennt.

## Vereinbartes Modell

- Ein `User` ist ein Login-Konto mit Name, E-Mail, Status und letztem Login.
- Eine `Role` bündelt Berechtigungen. Zum Start gibt es `Admin` und `User`.
- Berechtigungen werden serverseitig geprüft; ausgeblendete Menüpunkte sind nur Komfort, keine Sicherheit.
- `Admin` darf Benutzer einladen, Rollen ändern, deaktivieren und Systemeinstellungen verwalten.
- `User` darf die normalen CRM-, Event- und operativen Arbeitsabläufe verwenden, aber keine Benutzer- oder Systemeinstellungen ändern.
- Benutzer werden deaktiviert statt gelöscht, damit Audit-Log, Autorenschaft und historische Dokumente erhalten bleiben.
- Einladungen laufen über einen einmalig verwendbaren, zeitlich begrenzten Link. Passwort-Reset und Session-Widerruf gehören zur Kontoverwaltung.
- Kritische Änderungen an Benutzern, Rollen und Einstellungen werden im unveränderlichen Audit-Log protokolliert.

## Verwaltung im Produkt

Unter `Einstellungen → Benutzer & Berechtigungen` sieht ein Admin eine Tabelle mit Name, E-Mail, Rolle, Status und letztem Login. Dort kann er Benutzer einladen, eine Rolle ändern, den Zugang deaktivieren/reaktivieren und ausstehende Einladungen zurückziehen oder erneut senden.

## Offene Erweiterungen

Weitere Rollen oder feinere Berechtigungen (z. B. Finanzen, nur Lesen, Event-Verantwortlicher) sollten erst aus konkreten Arbeitsabläufen entstehen. Eventrollen wie `Anmeldung`, `Finanzen` und `Timing` beschreiben weiterhin die Funktion eines Kontakts bei einem Event und sind keine Login-Berechtigungen.

## Evidenz

- User conversation, 2026-09-09.
- [Person, Kundenprofil und Eventrollen](2026-08-21-person-kundenprofil-und-eventrollen.md) für die Abgrenzung fachlicher Eventrollen.
- [Invoice MVP spec](../tasks/invoice-mvp-spec.md) dokumentiert das bisherige Modell ohne Rollen.
