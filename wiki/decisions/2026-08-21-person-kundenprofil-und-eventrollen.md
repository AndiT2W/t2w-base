---
title: Person, Kundenprofil und Eventrollen
type: decision
status: accepted
updated: 2026-08-21
sources:
  - user conversation 2026-08-21
  - https://github.com/AndiT2W/t2w-base/issues/27
---

# Person, Kundenprofil und Eventrollen

## Entscheidung

- `Person` ist der kanonische Datensatz für eine natürliche Person.
- Ein optionales `Kundenprofil` macht dieselbe Person billingfähig; Kontakt und Kunde werden nicht doppelt angelegt.
- Ein Kunde kann auch eine Firma oder andere Organisation ohne eigene Person sein.
- Eine Person kann mehreren Kunden zugeordnet und mehreren Events als Ansprechpartner zugewiesen werden.
- Der sichtbare Menüpunkt heißt **Kunden & Kontakte**.
- `Veranstalter`, `Auszahlungsempfänger` und `Rechnungsempfänger` sind Eventrollen, die auf Kunden verweisen.
- Ein Event hat genau einen Veranstalter, genau einen Auszahlungsempfänger und einen oder mehrere Rechnungsempfänger.
- Der Veranstalter wird standardmäßig als Auszahlungsempfänger und Rechnungsempfänger vorbelegt; manuelle Abweichungen bleiben unabhängig erhalten.
- Initiale Eventkontaktrollen sind `Anmeldung`, `Finanzen` und `Timing`.
- Outlook-/Gmail-Synchronisation wird durch externe Identität und Statusfelder vorbereitet, aber nicht in diesem Schritt implementiert.

## Begriffe

- **Person:** Identität mit minimalen Kontaktdaten.
- **Kunde:** Person mit aktiviertem Kundenprofil oder eigenständiger Firmen-/Organisationsdatensatz.
- **Kontakt:** Verwendung einer Person als Ansprechpartner; keine zweite Entität.
- **Eventrolle:** Verwendung eines Kunden oder Kontakts im Kontext eines Events.

## Quelle

- [GitHub Issue #27](https://github.com/AndiT2W/t2w-base/issues/27)
- [Organizer Account Model](../concepts/organizer-account-model.md)
