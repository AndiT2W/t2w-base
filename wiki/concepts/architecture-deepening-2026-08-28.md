# Architekturvertiefung vom 2026-08-28

## Entscheidungen

- Die Event Editing Session ist der einzige intent-orientierte Seam für Änderungen an einem bestehenden Event. Der Event Workspace besitzt weiterhin Collection-Laden und Event-Anlage, veröffentlicht aber keine parallelen Bearbeitungsbefehle.
- Das gemeinsame CRM-Modul besitzt den vollständigen Personen- und Kundenprofil-Lebenszyklus. Erwartbare Ablehnungen werden als explizite Result-Typen geliefert; HTTP und Prisma bleiben Adapter.
- Der Event Detail Workspace koordiniert Such- und Auswahlzustände, Empfängerprojektionen, Outlook-Planung sowie pessimistische Event-Detail-Abläufe. React besitzt nur Darstellungszustände wie Tabs und Dialoge.

## Evidenz

- [`packages/domain/src/event.ts`](../../packages/domain/src/event.ts)
- [`packages/domain/src/crm.ts`](../../packages/domain/src/crm.ts)
- [`src/lib/t2w/event-detail-workspace.ts`](../../src/lib/t2w/event-detail-workspace.ts)
- [`src/routes/events.$eventcode.tsx`](../../src/routes/events.$eventcode.tsx)
- Benutzerentscheidungen im Architektur-Review vom 2026-08-28.

## Verifikation

- Interface-Tests decken Event Editing Session, CRM-Lebenszyklus und Event Detail Workspace ab.
- Persistenzsichtbare Event-Detail-Abläufe bleiben durch den vollständigen Browser-Test geschützt.
