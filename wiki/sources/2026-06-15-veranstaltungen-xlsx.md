# Source: Veranstaltungsuebersicht XLSX 2026-06-15

## Metadata

- Date: 2026-06-15
- Type: spreadsheet export
- Location: `C:\Users\andi\Downloads\2026-06-15T16_33_44.670Z TIME 2 WIN - TIME 2 WIN - Office - VERANSTALTUNGEN.xlsx`
- Status: inspected

## Summary

- The workbook appears to be a ClickUp export of the `VERANSTALTUNGEN` list.
- It contains a central event overview where each row represents one event entry.
- The export includes both core event data and links to event-management structures.
- The workbook supports the interpretation that each event has its own linked operational task management.

## Workbook Structure

- Workbook contains 1 sheet: `Tasks`.
- Used range observed: `A1:CF101`.
- Row 3 contains the column headers.
- Data rows appear to start at row 4.

## Key Observations

- The current event overview uses `Task ID` as the ClickUp record id and also contains a separate `Event Id`.
- Relevant observed event fields include:
  - `Task Name`
  - `Status`
  - `Due Date`
  - `Start Date`
  - `Backend`
  - `Betrag Payment`
  - `Betrag Timing`
  - `Event Id`
  - `Eventstatus`
  - `Kunde`
  - `Organisator`
  - `Ort`
  - `Sportart`
  - `Teilnehmer`
  - `Typ`
  - `Veranstalter`
  - `VeranstaltungsMgmtId`
  - `Veranstaltungsmanagement`
- The export also contains operational staffing and equipment-related fields such as:
  - `Mitarbeiter_eingeteilt`
  - `Mitarbeiter_remote`
  - `Mitarbeiterstatus`
  - `GPS PRO`
  - `GPS STD`
  - `TON`
  - `UHF 4`
  - `UHF 8`
  - `UHF Matte`
- Sample rows show event-specific backend URLs and organizer-related financial/contact fields.

## Implications For Project

- `Event` or `Veranstaltung` should be modeled as a first-class domain object in GCW Base.
- `Event Id` should remain a durable business identifier, separate from any internal row id.
- The linked `VeranstaltungsMgmtId` and `Veranstaltungsmanagement` fields imply a dedicated operational task container per event.
- Migration planning should preserve both the event overview fields and the event-to-management linkage.

## Related Pages

- [../specification-v1.md](../specification-v1.md)
- [../concepts/event-registry-and-management.md](../concepts/event-registry-and-management.md)
- [../concepts/tool-consolidation-and-migration.md](../concepts/tool-consolidation-and-migration.md)
- [../entities/gcw-base.md](../entities/gcw-base.md)
