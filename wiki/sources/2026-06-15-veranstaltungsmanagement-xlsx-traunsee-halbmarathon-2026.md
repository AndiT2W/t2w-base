# Source: Veranstaltungsmanagement XLSX Traunsee Halbmarathon 2026

## Metadata

- Date: 2026-06-15
- Type: spreadsheet export
- Location: `C:\Users\andi\Downloads\2026-06-15T16_35_04.135Z TIME 2 WIN - VERANSTALTUNGSMANAGEMENT - 260620 Traunsee Halbmarathon 2026.xlsx`
- Status: inspected

## Summary

- The workbook appears to be a ClickUp export of the event-management list for one concrete event.
- The event is `260620 Traunsee Halbmarathon 2026`.
- The workbook shows the detailed open-task structure for one event rather than the top-level event registry.
- Tasks are grouped into operational sections such as `Timing`, `Startnummern`, `Finanz`, and `Vorbereitung`.

## Workbook Structure

- Workbook contains 1 sheet: `Tasks`.
- Used range observed: `A1:AK35`.
- The export is structured as repeated blocks:
  - a section title row,
  - a repeated header row,
  - task rows for that section.

## Key Observations

- The `List` value for the tasks is `260620_traunsee_halbmarathon_2026`, which appears to be the event-specific management container.
- Observed task sections include:
  - `Timing`
  - `Startnummern`
  - `Finanz`
  - `Vorbereitung`
- Observed task fields include:
  - `Task ID`
  - `Task Name`
  - `Status`
  - `Task Content`
  - `Assignee`
  - `Due Date`
  - `Start Date`
  - `Type (drop down)`
  - `Vorbereitung [h] (number)`
  - `Vorbereitung notw. (checkbox)`
- Observed statuses include:
  - `OFFEN`
  - `IN ARBEIT`
  - `KOMPLETT`
- Assignees can be single internal actors such as `Office`, named employees, or multiple assignees.
- Some tasks include detailed content instructions, external coordination notes, or linked subtasks.

## Implications For Project

- GCW Base should model one event-management workflow per event, not only a flat task table.
- Task grouping is a first-class requirement because the current operational structure is section-based.
- The task model should support event-specific workflow sections, status tracking, assignees, dates, notes, and optional preparation metadata.
- A future import or migration should preserve the event-specific container name and the section semantics even if the UI becomes more normalized.

## Related Pages

- [../specification-v1.md](../specification-v1.md)
- [../concepts/event-management-task-model.md](../concepts/event-management-task-model.md)
- [../concepts/event-registry-and-management.md](../concepts/event-registry-and-management.md)
- [../sources/2026-06-15-veranstaltungen-xlsx.md](2026-06-15-veranstaltungen-xlsx.md)
