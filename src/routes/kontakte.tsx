import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/t2w/PageHeader";
import {
  ColumnPicker,
  DataTable,
  SortHeader,
  TableToolbar,
  useTableBehavior,
} from "@/components/t2w/DataTable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCrm, passtKunde, passtPerson } from "@/lib/crm/store";
import { KUNDENSTATUS_LABEL, personName, type Kunde, type Person } from "@/lib/crm/types";
import { useT2W } from "@/lib/t2w/store";

export const Route = createFileRoute("/kontakte")({ component: KundenKontakte });
type Auswahl = { art: "person" | "kunde"; id: string } | null;
type Modus = "person" | "kunde" | "beides";
const CUSTOMER_COLUMN_STORAGE_KEY = "t2w-customer-table-columns";
const CUSTOMER_COLUMNS = [
  "Kunde",
  "Hauptansprechperson",
  "E-Mail",
  "UID",
  "IBAN",
  "Kontakte",
  "Events",
  "Status",
] as const;
type CustomerColumn = (typeof CUSTOMER_COLUMNS)[number];
const PEOPLE_COLUMNS = [
  "Name",
  "Funktion",
  "E-Mail",
  "Telefon",
  "Kunden",
  "Eventrollen",
  "Kundenprofil",
] as const;
type PeopleColumn = (typeof PEOPLE_COLUMNS)[number];
/**
 * Zellinhalt je Spalte.  Die Zeilen geben ihre Zellen in der Reihenfolge von
 * `visibleColumns` aus, damit die im Spaltenmenü gewählte Reihenfolge auch die
 * Anzeigereihenfolge ist.
 */
function peopleCell(person: Person, column: PeopleColumn): ReactNode {
  switch (column) {
    case "Name":
      return personName(person);
    case "Funktion":
      return person.funktion || "–";
    case "E-Mail":
      return person.email || "–";
    case "Telefon":
      return person.telefonBeruflich || person.telefonPrivat || "–";
    case "Kunden":
      return person.kundenIds.length;
    case "Eventrollen":
      return person.eventRollen.length;
    case "Kundenprofil":
      return person.kundenprofilId ? <Chip good>ja</Chip> : <Chip>nein</Chip>;
  }
}

function customerCell(customer: Kunde, column: CustomerColumn, people: Person[]): ReactNode {
  switch (column) {
    case "Kunde":
      return customer.name;
    case "Hauptansprechperson":
      return customer.primaryContactId
        ? personName(people.find((p) => p.id === customer.primaryContactId) ?? ({} as Person))
        : "–";
    case "E-Mail":
      return customer.email || "–";
    case "UID":
      return customer.uid || "–";
    case "IBAN":
      return customer.iban || "–";
    case "Kontakte":
      return customer.kontaktIds.length;
    case "Events":
      return customer.events.length;
    case "Status":
      return <Chip good={customer.status === "aktiv"}>{KUNDENSTATUS_LABEL[customer.status]}</Chip>;
  }
}

const input = "w-full rounded border border-input bg-background px-2 py-1.5 text-sm";
const validEmail = (value: string) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const validPhone = (value: string) => !value || /^[+0-9() ./-]+$/.test(value);
const Chip = ({ children, good = false }: { children: ReactNode; good?: boolean }) => (
  <span
    className={`inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] ${good ? "border-status-zugesagt/40 bg-status-zugesagt/15" : "border-border bg-secondary text-muted-foreground"}`}
  >
    {children}
  </span>
);

function groupPersonEventRoles(eventRollen: Person["eventRollen"]) {
  const events = new Map<string, { eventcode: string; eventName: string; rollen: string[] }>();
  for (const { eventcode, eventName, rolle } of eventRollen) {
    const event = events.get(eventcode) ?? { eventcode, eventName, rollen: [] };
    if (!event.rollen.includes(rolle)) event.rollen.push(rolle);
    events.set(eventcode, event);
  }
  return [...events.values()];
}

function groupCustomerEvents(events: Kunde["events"]) {
  const grouped = new Map<
    string,
    { eventcode: string; eventName: string; funktionen: Kunde["events"][number]["funktion"][] }
  >();
  for (const { eventcode, eventName, funktion } of events) {
    const event = grouped.get(eventcode) ?? { eventcode, eventName, funktionen: [] };
    if (!event.funktionen.includes(funktion)) event.funktionen.push(funktion);
    grouped.set(eventcode, event);
  }
  return [...grouped.values()];
}

const customerEventFunctionLabel: Record<Kunde["events"][number]["funktion"], string> = {
  veranstalter: "Veranstalter",
  auszahlung: "Auszahlungsempfänger",
  rechnung: "Rechnungsempfänger",
};

function Field({
  label,
  value,
  save,
  area = false,
  validate,
}: {
  label: string;
  value: string;
  save: (v: string) => void | Promise<void>;
  area?: boolean;
  validate?: (value: string) => string | null;
}) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const commit = async () => {
    if (draft !== value) {
      const next = draft.trim();
      const validationError = validate?.(next);
      if (validationError) {
        setError(validationError);
        toast.error(validationError);
        return;
      }
      try {
        await save(next);
        setError(null);
        toast.success(`${label} gespeichert`);
      } catch {
        toast.error(`${label} konnte nicht gespeichert werden`);
      }
    }
  };
  return (
    <label className="block space-y-1 text-xs text-muted-foreground">
      <span>{label}</span>
      {area ? (
        <textarea
          aria-label={label}
          rows={3}
          className={input}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setError(null);
          }}
          onBlur={() => void commit()}
          aria-invalid={!!error}
        />
      ) : (
        <input
          aria-label={label}
          className={input}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setError(null);
          }}
          onBlur={() => void commit()}
          aria-invalid={!!error}
        />
      )}
      {error && (
        <span role="alert" className="text-destructive">
          {error}
        </span>
      )}
    </label>
  );
}
function KundenKontakte() {
  const crm = useCrm();
  const { currentUser } = useT2W();
  const [tab, setTab] = useState<"kontakte" | "kunden">("kontakte");
  // Spaltenzustand beider Tabellen liegt hier, damit die Werkzeuge auf
  // Höhe der Tab-Leiste stehen können. Es ist immer nur eine Tabelle
  // gemountet, deshalb genügt eine Referenz für den Export.
  const peopleTable = usePeopleTable();
  const customerTable = useCustomerTable(crm.personen);
  const tableRef = useRef<HTMLTableElement>(null);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Auswahl>(null);
  const [create, setCreate] = useState(false);
  const createTriggerRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (window.location.search.includes("neu=1")) setCreate(true);
    const params = new URLSearchParams(window.location.search);
    const kundeId = params.get("kunde");
    const personId = params.get("person");
    if (kundeId && crm.kunden.some((kunde) => kunde.id === kundeId))
      setSel({ art: "kunde", id: kundeId });
    if (personId && crm.personen.some((person) => person.id === personId))
      setSel({ art: "person", id: personId });
  }, [crm.kunden, crm.personen]);
  function closeCreate() {
    setCreate(false);
    window.history.replaceState({}, "", "/kontakte");
    window.requestAnimationFrame(() => createTriggerRef.current?.focus());
  }
  const people = useMemo(
    () =>
      crm.personen
        .filter((p) => passtPerson(p, q, crm.kunden))
        .sort((a, b) => personName(a).localeCompare(personName(b), "de")),
    [crm.personen, crm.kunden, q],
  );
  const customers = useMemo(
    () =>
      crm.kunden.filter((k) => passtKunde(k, q)).sort((a, b) => a.name.localeCompare(b.name, "de")),
    [crm.kunden, q],
  );
  const p = sel?.art === "person" ? crm.personen.find((x) => x.id === sel.id) : undefined;
  const k = sel?.art === "kunde" ? crm.kunden.find((x) => x.id === sel.id) : undefined;
  return (
    <div>
      <PageHeader
        krumen={[{ label: "Übersicht", to: "/" }]}
        titel="Kunden & Kontakte"
        beschreibung="Stammdaten: Kontakte pflegen und Kundenprofile für Organisationen und Abrechnung verwalten"
        suche={{
          value: q,
          onChange: setQ,
          placeholder: currentUser.financeAccess
            ? "Name, E-Mail, Telefon, UID, IBAN …"
            : "Name, E-Mail, Telefon oder UID …",
        }}
        aktion={
          <a
            ref={createTriggerRef}
            href="/kontakte?neu=1"
            className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
          >
            <Plus className="mr-1 size-4" />
            Neu anlegen
          </a>
        }
      />
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3 border-b border-border pb-3">
          <div className="flex gap-1" role="tablist" aria-label="Kontaktansicht">
            <button
              onClick={() => {
                setTab("kontakte");
              }}
              role="tab"
              aria-selected={tab === "kontakte"}
              className={`rounded-md px-3 py-1.5 text-sm ${tab === "kontakte" ? "bg-accent font-medium" : "hover:bg-secondary"}`}
            >
              Kontakte ({people.length})
            </button>
            <button
              onClick={() => {
                setTab("kunden");
              }}
              role="tab"
              aria-selected={tab === "kunden"}
              className={`rounded-md px-3 py-1.5 text-sm ${tab === "kunden" ? "bg-accent font-medium" : "hover:bg-secondary"}`}
            >
              Kunden ({customers.length})
            </button>
          </div>

          {/* Auf Höhe der Tab-Leiste statt in einer eigenen Zeile über der Tabelle. */}
          <div className="ml-auto hidden md:block">
            {tab === "kontakte"
              ? people.length > 0 && (
                  <TableToolbar
                    tableRef={tableRef}
                    exportName="Kontakte"
                    columnPicker={
                      <ColumnPicker
                        columns={PEOPLE_COLUMNS}
                        visibleColumns={peopleTable.visibleColumns}
                        toggleColumn={peopleTable.toggleColumn}
                        moveColumn={peopleTable.moveColumn}
                      />
                    }
                  />
                )
              : customers.length > 0 && (
                  <TableToolbar
                    tableRef={tableRef}
                    exportName="Kunden"
                    columnPicker={
                      <ColumnPicker
                        columns={sichtbareKundenSpaltenVon(
                          [...CUSTOMER_COLUMNS],
                          currentUser.financeAccess,
                        )}
                        visibleColumns={sichtbareKundenSpaltenVon(
                          customerTable.visibleColumns,
                          currentUser.financeAccess,
                        )}
                        toggleColumn={customerTable.toggleColumn}
                        moveColumn={customerTable.moveColumn}
                      />
                    }
                  />
                )}
          </div>
        </div>
        {tab === "kontakte" ? (
          <PeopleTable
            people={people}
            select={(id) => setSel({ art: "person", id })}
            open={() => setCreate(true)}
            table={peopleTable}
            tableRef={tableRef}
          />
        ) : (
          <CustomerTable
            customers={customers}
            people={crm.personen}
            select={(id) => setSel({ art: "kunde", id })}
            open={() => setCreate(true)}
            financeAccess={currentUser.financeAccess}
            table={customerTable}
            tableRef={tableRef}
          />
        )}
        <p className="rounded border border-dashed border-border p-3 text-xs text-muted-foreground">
          Inline-Änderungen werden beim Verlassen eines Feldes gespeichert. Outlook-/Gmail-Abgleich
          ist vorbereitet.
        </p>
      </div>
      {sel && (p || k) && (
        <Sheet open onOpenChange={(open) => !open && setSel(null)}>
          <SheetContent side="right" className="w-full max-w-xl overflow-y-auto p-5 sm:max-w-xl">
            <SheetHeader className="mb-5 pr-10 text-left">
              <SheetTitle>{p ? personName(p) : k?.name}</SheetTitle>
              <SheetDescription className="sr-only">
                Stammdaten und Zuordnungen bearbeiten
              </SheetDescription>
            </SheetHeader>
            {p ? (
              <>
                <PersonDetail person={p} crm={crm} go={(id) => setSel({ art: "kunde", id })} />
                <AssociationRemover
                  label="Kundenzuordnung entfernen"
                  items={crm.kundenVonPerson(p).map((x) => [x.id, x.name] as const)}
                  remove={(id) => crm.loeseVerknuepfung(p.id, id)}
                />
              </>
            ) : (
              <>
                <CustomerDetail
                  customer={k!}
                  crm={crm}
                  go={(id) => setSel({ art: "person", id })}
                  financeAccess={currentUser.financeAccess}
                />
                <AssociationRemover
                  label="Kontaktzuordnung entfernen"
                  items={crm.kontakteVonKunde(k!.id).map((x) => [x.id, personName(x)] as const)}
                  remove={(id) => crm.loeseVerknuepfung(id, k!.id)}
                />
              </>
            )}
            <div className="mt-8 border-t border-border pt-4">
              <DeleteAction
                label={p ? "Kontakt löschen" : "Kunde löschen"}
                onDelete={async () => {
                  if (p) await crm.deletePerson(p.id);
                  else await crm.deleteKunde(k!.id);
                  setSel(null);
                }}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}
      {create && (
        <CreateDialog crm={crm} close={closeCreate} financeAccess={currentUser.financeAccess} />
      )}
    </div>
  );
}
/**
 * Der Spaltenzustand liegt bei der Seite, nicht bei der Tabelle: nur so können
 * Spaltenauswahl und Export auf Höhe der Tab-Leiste stehen statt in einer
 * eigenen Zeile über der Tabelle.
 */
function usePeopleTable() {
  return useTableBehavior<Person, PeopleColumn>({
    storageKey: "t2w-contact-table-columns",
    initialSort: { key: "Name", direction: "asc" },
    columns: PEOPLE_COLUMNS.map((key) => ({
      key,
      sortValue: (person) =>
        ({
          Name: personName(person),
          Funktion: person.funktion,
          "E-Mail": person.email,
          Telefon: person.telefonBeruflich || person.telefonPrivat,
          Kunden: person.kundenIds.length,
          Eventrollen: person.eventRollen.length,
          Kundenprofil: person.kundenprofilId ? "ja" : "nein",
        })[key] ?? "",
    })),
  });
}

function PeopleTable({
  people,
  select,
  open,
  table,
  tableRef,
}: {
  people: Person[];
  select: (id: string) => void;
  open: () => void;
  table: ReturnType<typeof usePeopleTable>;
  tableRef: React.RefObject<HTMLTableElement | null>;
}) {
  const { visibleColumns } = table;
  const sortedPeople = table.rows(people);
  return people.length ? (
    <>
      <Table
        exportName="Kontakte"
        h={visibleColumns}
        sort={table.sort}
        onSort={table.sortBy}
        tableRef={tableRef}
      >
        {sortedPeople.map((p) => (
          <tr
            key={p.id}
            onClick={() => select(p.id)}
            className="cursor-pointer border-t border-border hover:bg-accent/50"
          >
            {visibleColumns.map((column) => (
              <td key={column}>{peopleCell(p, column)}</td>
            ))}
          </tr>
        ))}
      </Table>
    </>
  ) : (
    <Empty text="Keine Kontakte gefunden." open={open} label="Person anlegen" />
  );
}
function useCustomerTable(people: Person[]) {
  return useTableBehavior<Kunde, CustomerColumn>({
    storageKey: CUSTOMER_COLUMN_STORAGE_KEY,
    initialSort: { key: "Kunde", direction: "asc" },
    columns: CUSTOMER_COLUMNS.map((key) => ({
      key,
      sortValue: (customer) =>
        ({
          Kunde: customer.name,
          Hauptansprechperson: customer.primaryContactId
            ? personName(people.find((p) => p.id === customer.primaryContactId) ?? ({} as Person))
            : "",
          "E-Mail": customer.email,
          UID: customer.uid,
          IBAN: customer.iban,
          Kontakte: customer.kontaktIds.length,
          Events: customer.events.length,
          Status: KUNDENSTATUS_LABEL[customer.status],
        })[key] ?? "",
    })),
  });
}

/** Ohne Finanzzugriff verschwindet die IBAN-Spalte aus Kopf und Zellen. */
function sichtbareKundenSpaltenVon(visibleColumns: CustomerColumn[], financeAccess: boolean) {
  return visibleColumns.filter((column) => financeAccess || column !== "IBAN");
}

function CustomerTable({
  customers,
  people,
  select,
  open,
  financeAccess,
  table,
  tableRef,
}: {
  customers: Kunde[];
  people: Person[];
  select: (id: string) => void;
  open: () => void;
  financeAccess: boolean;
  table: ReturnType<typeof useCustomerTable>;
  tableRef: React.RefObject<HTMLTableElement | null>;
}) {
  const sichtbareKundenSpalten = sichtbareKundenSpaltenVon(table.visibleColumns, financeAccess);
  const sortedCustomers = table.rows(customers);
  return customers.length ? (
    <>
      <Table
        exportName="Kunden"
        h={sichtbareKundenSpalten}
        sort={table.sort}
        onSort={table.sortBy}
        tableRef={tableRef}
      >
        {sortedCustomers.map((k) => (
          <tr
            key={k.id}
            onClick={() => select(k.id)}
            className="cursor-pointer border-t border-border hover:bg-accent/50"
          >
            {sichtbareKundenSpalten.map((column) => (
              <td key={column}>{customerCell(k, column, people)}</td>
            ))}
          </tr>
        ))}
      </Table>
    </>
  ) : (
    <Empty text="Keine Kunden gefunden." open={open} label="Kunde anlegen" />
  );
}
function Table<K extends string>({
  exportName,
  h,
  children,
  sort,
  onSort,
  tableRef,
}: {
  exportName: string;
  h: readonly K[];
  children: ReactNode;
  sort: { key: K; direction: "asc" | "desc" };
  onSort: (key: K) => void;
  tableRef: React.RefObject<HTMLTableElement | null>;
}) {
  return (
    <DataTable
      ref={tableRef}
      exportName={exportName}
      tools="extern"
      className="min-w-[54rem] text-[13px] leading-4 [&_thead_tr]:h-[30px] [&_tbody_tr]:h-[34px]"
    >
      <thead className="t2w-table-header text-left">
        <tr>
          {h.map((x) => (
            <th key={x} className="px-2 py-1.5">
              <SortHeader
                label={x}
                active={sort.key === x}
                direction={sort.direction}
                onSort={() => onSort(x)}
              />
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="[&_td]:px-2 [&_td]:py-1">{children}</tbody>
    </DataTable>
  );
}
function Empty({ text, open, label }: { text: string; open: () => void; label: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-8 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
      <Button size="sm" className="mt-3" onClick={open}>
        {label}
      </Button>
    </div>
  );
}
function PersonDetail({
  person,
  crm,
  go,
}: {
  person: Person;
  crm: ReturnType<typeof useCrm>;
  go: (id: string) => void;
}) {
  const assigned = crm.kundenVonPerson(person);
  const events = groupPersonEventRoles(person.eventRollen);
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Vorname"
          value={person.vorname}
          save={(v) => crm.updatePerson(person.id, { vorname: v })}
        />
        <Field
          label="Nachname"
          value={person.nachname}
          save={(v) => crm.updatePerson(person.id, { nachname: v })}
        />
        <Field
          label="Funktion"
          value={person.funktion}
          save={(v) => crm.updatePerson(person.id, { funktion: v })}
        />
        <Field
          label="E-Mail"
          value={person.email}
          save={(v) => crm.updatePerson(person.id, { email: v })}
          validate={(value) =>
            validEmail(value) ? null : "Bitte eine gültige Mail-Adresse angeben."
          }
        />
        <Field
          label="Telefon privat"
          value={person.telefonPrivat}
          save={(v) => crm.updatePerson(person.id, { telefonPrivat: v })}
          validate={(value) =>
            validPhone(value) ? null : "Bitte eine gültige Telefonnummer angeben."
          }
        />
        <Field
          label="Telefon beruflich"
          value={person.telefonBeruflich}
          save={(v) => crm.updatePerson(person.id, { telefonBeruflich: v })}
          validate={(value) =>
            validPhone(value) ? null : "Bitte eine gültige Telefonnummer angeben."
          }
        />
        <Field
          label="Ort"
          value={person.ort}
          save={(v) => crm.updatePerson(person.id, { ort: v })}
        />
        <Field
          label="Straße"
          value={person.strasse}
          save={(v) => crm.updatePerson(person.id, { strasse: v })}
        />
        <Field
          label="PLZ"
          value={person.plz}
          save={(v) => crm.updatePerson(person.id, { plz: v })}
        />
        <Field
          label="Land"
          value={person.land}
          save={(v) => crm.updatePerson(person.id, { land: v })}
        />
        <div className="sm:col-span-2">
          <Field
            label="Notiz"
            area
            value={person.notiz}
            save={(v) => crm.updatePerson(person.id, { notiz: v })}
          />
        </div>
      </div>
      <section>
        <h3 className="mb-2 font-semibold">Kundenverknüpfungen ({assigned.length})</h3>
        {assigned.map((k) => (
          <button
            key={k.id}
            onClick={() => go(k.id)}
            className="mr-2 rounded border border-border px-2 py-1 text-sm"
          >
            {k.name}
          </button>
        ))}
        <Assign
          label="Kunde zuordnen"
          options={crm.kunden
            .filter((k) => !person.kundenIds.includes(k.id))
            .map((k) => [k.id, k.name] as const)}
          save={(id) => crm.verknuepfe(person.id, id)}
        />
      </section>
      <section>
        <h3 className="mb-2 font-semibold">Events ({events.length})</h3>
        <div className="space-y-2">
          {events.map((event) => (
            <a
              key={event.eventcode}
              href={`/events/${event.eventcode}`}
              className="flex flex-wrap items-center gap-2 rounded border border-border p-2 text-sm hover:bg-accent/50"
            >
              <span className="font-medium">{event.eventName}</span>
              <span className="font-mono text-xs text-muted-foreground">{event.eventcode}</span>
              {event.rollen.map((rolle) => (
                <Chip key={rolle}>{rolle}</Chip>
              ))}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
function CustomerDetail({
  customer,
  crm,
  go,
  financeAccess,
}: {
  customer: Kunde;
  crm: ReturnType<typeof useCrm>;
  go: (id: string) => void;
  financeAccess: boolean;
}) {
  const contacts = crm.kontakteVonKunde(customer.id);
  const events = groupCustomerEvents(customer.events);
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Kundenname"
          value={customer.name}
          save={(v) => crm.updateKunde(customer.id, { name: v })}
        />
        <label className="text-xs text-muted-foreground">
          Status
          <select
            aria-label="Status"
            className={input}
            value={customer.status}
            onChange={(e) =>
              crm.updateKunde(customer.id, { status: e.target.value as Kunde["status"] })
            }
          >
            <option value="aktiv">Aktiv</option>
            <option value="inaktiv">Inaktiv</option>
          </select>
        </label>
        <Field
          label="UID-Nummer"
          value={customer.uid}
          save={(v) => crm.updateKunde(customer.id, { uid: v })}
        />
        <Field
          label="Mail"
          value={customer.email}
          save={(v) => crm.updateKunde(customer.id, { email: v })}
          validate={(value) =>
            validEmail(value) ? null : "Bitte eine gültige Mail-Adresse angeben."
          }
        />
        <div className="sm:col-span-2">
          <Field
            label="Straße"
            value={customer.strasse}
            save={(v) => crm.updateKunde(customer.id, { strasse: v })}
          />
          <Field
            label="PLZ"
            value={customer.plz}
            save={(v) => crm.updateKunde(customer.id, { plz: v })}
          />
          <Field
            label="Ort"
            value={customer.ort}
            save={(v) => crm.updateKunde(customer.id, { ort: v })}
          />
          <Field
            label="Land"
            value={customer.land}
            save={(v) => crm.updateKunde(customer.id, { land: v })}
          />
        </div>
        {financeAccess && (
          <Field
            label="IBAN"
            value={customer.iban}
            save={(v) => crm.updateKunde(customer.id, { iban: v })}
          />
        )}
        {financeAccess && (
          <Field
            label="BIC"
            value={customer.bic}
            save={(v) => crm.updateKunde(customer.id, { bic: v })}
          />
        )}
        {financeAccess && (
          <Field
            label="Bank"
            value={customer.bank}
            save={(v) => crm.updateKunde(customer.id, { bank: v })}
          />
        )}
      </div>
      <section>
        <h3 className="mb-2 font-semibold">Hauptansprechperson</h3>
        <select
          aria-label="Hauptansprechperson"
          className={input}
          value={customer.primaryContactId ?? ""}
          onChange={(e) =>
            void crm.updateKunde(customer.id, { primaryContactId: e.target.value || null })
          }
        >
          <option value="">Keine Hauptansprechperson</option>
          {contacts.map((person) => (
            <option key={person.id} value={person.id}>
              {personName(person)}
            </option>
          ))}
        </select>
      </section>
      <section>
        <h3 className="mb-2 font-semibold">Kontakte ({contacts.length})</h3>
        {contacts.map((p) => (
          <button
            key={p.id}
            onClick={() => go(p.id)}
            className="mr-2 rounded border border-border px-2 py-1 text-sm"
          >
            {personName(p)}
          </button>
        ))}
        <Assign
          label="Kontakt zuordnen"
          options={crm.personen
            .filter((p) => !p.kundenIds.includes(customer.id))
            .map((p) => [p.id, personName(p)] as const)}
          save={(id) => crm.verknuepfe(id, customer.id)}
        />
      </section>
      <section>
        <h3 className="mb-2 font-semibold">Events ({events.length})</h3>
        {events.length ? (
          <div className="space-y-2">
            {events.map((event) => (
              <a
                key={event.eventcode}
                href={`/events/${event.eventcode}`}
                className="flex flex-wrap items-center gap-2 rounded border border-border p-2 text-sm hover:bg-accent/50"
              >
                <span className="font-medium">{event.eventName}</span>
                <span className="font-mono text-xs text-muted-foreground">{event.eventcode}</span>
                {event.funktionen.map((funktion) => (
                  <Chip key={funktion}>{customerEventFunctionLabel[funktion]}</Chip>
                ))}
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Keine Events zugeordnet.</p>
        )}
      </section>
    </div>
  );
}

function DeleteAction({ label, onDelete }: { label: string; onDelete: () => Promise<void> }) {
  async function remove() {
    if (!window.confirm(`${label} wirklich aus den Stammdaten löschen?`)) return;
    try {
      await onDelete();
      toast.success("Datensatz gelöscht");
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes("referenziert") || error.message.includes("409"))
      ) {
        toast.warning("Löschen nicht möglich: Der Datensatz wird noch verwendet.");
      } else {
        toast.error("Datensatz konnte nicht gelöscht werden.");
      }
    }
  }
  return (
    <div className="flex justify-end">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => void remove()}
      >
        <Trash2 className="mr-1.5 size-4 text-destructive" />
        {label}
      </Button>
    </div>
  );
}
function AssociationRemover({
  label,
  items,
  remove,
}: {
  label: string;
  items: readonly (readonly [string, string])[];
  remove: (id: string) => void;
}) {
  if (!items.length) return null;
  return (
    <section className="mt-5 border-t border-border pt-4">
      <h3 className="mb-2 text-sm font-semibold">{label}</h3>
      <div className="flex flex-wrap gap-2">
        {items.map(([id, name]) => (
          <button
            key={id}
            type="button"
            className="rounded border border-border px-2 py-1 text-xs hover:bg-destructive/10"
            onClick={() => {
              remove(id);
              toast.success("Zuordnung entfernt");
            }}
          >
            {name} ×
          </button>
        ))}
      </div>
    </section>
  );
}
function Assign({
  label,
  options,
  save,
}: {
  label: string;
  options: readonly (readonly [string, string])[];
  save: (id: string) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const visible = options.filter(([, name]) =>
    name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const listId = `${label.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}-options`;
  async function selectOption(id: string) {
    if (saving) return;
    setSaving(true);
    try {
      await save(id);
      setQuery("");
      setOpen(false);
      setActiveIndex(0);
      toast.success(
        label === "Kunde zuordnen" ? "Kundenzuordnung gespeichert" : "Kontaktzuordnung gespeichert",
      );
      inputRef.current?.focus();
    } catch {
      toast.error("Zuordnung konnte nicht gespeichert werden");
      setOpen(true);
    } finally {
      setSaving(false);
    }
  }
  function selectActive() {
    const option = visible[activeIndex];
    if (option) selectOption(option[0]);
  }
  return (
    <div className="mt-3 space-y-2">
      <input
        ref={inputRef}
        role="combobox"
        aria-label={label}
        aria-autocomplete="list"
        aria-controls={open ? listId : undefined}
        aria-expanded={open}
        aria-activedescendant={
          open && visible[activeIndex] ? `${listId}-${visible[activeIndex][0]}` : undefined
        }
        className={input}
        disabled={saving}
        value={query}
        placeholder={`${label} suchen …`}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveIndex(0);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActiveIndex((index) => Math.min(index + 1, Math.max(visible.length - 1, 0)));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            void selectActive();
          } else if (e.key === "Escape") {
            e.preventDefault();
            setOpen(false);
          }
        }}
      />
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="max-h-48 overflow-y-auto rounded border border-border bg-background p-1 shadow-sm"
        >
          {visible.length ? (
            visible.map(([id, name], index) => (
              <li
                id={`${listId}-${id}`}
                key={id}
                role="option"
                aria-selected={index === activeIndex}
                className={`cursor-pointer rounded px-2 py-1.5 text-sm ${index === activeIndex ? "bg-accent" : ""}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setActiveIndex(index);
                  void selectOption(id);
                }}
              >
                {name}
              </li>
            ))
          ) : (
            <li
              role="option"
              aria-disabled="true"
              className="px-2 py-1.5 text-sm text-muted-foreground"
            >
              Keine Treffer
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
function CreateDialog({
  crm,
  close,
  financeAccess,
}: {
  crm: ReturnType<typeof useCrm>;
  close: () => void;
  financeAccess: boolean;
}) {
  const [mode, setMode] = useState<Modus>("person");
  const [p, setP] = useState({
    vorname: "",
    nachname: "",
    email: "",
    telefonPrivat: "",
    telefonBeruflich: "",
    funktion: "",
    ort: "",
    land: "",
    strasse: "",
    plz: "",
    notiz: "",
  });
  const [k, setK] = useState({
    name: "",
    uid: "",
    iban: "",
    bic: "",
    bank: "",
    land: "",
    ort: "",
    strasse: "",
    plz: "",
    email: "",
  });
  const create = async () => {
    if (mode !== "kunde" && !p.vorname && !p.nachname) {
      toast.error("Vor- oder Nachname ist erforderlich.");
      return;
    }
    if (mode === "kunde" && !k.name) {
      toast.error("Kundenname ist erforderlich.");
      return;
    }
    const email = mode === "kunde" ? k.email : p.email;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Bitte eine gültige Mail-Adresse angeben.");
      return;
    }
    if (
      mode !== "kunde" &&
      [p.telefonPrivat, p.telefonBeruflich].some((phone) => phone && !/^[+0-9() ./-]+$/.test(phone))
    ) {
      toast.error("Bitte gültige Telefonnummern angeben.");
      return;
    }
    if (mode === "person") await crm.neuePerson({ ...p, kundenIds: [] });
    else if (mode === "kunde") await crm.neuerKunde({ typ: "firma", status: "aktiv", ...k });
    else {
      const old = crm.findeDublette(p.vorname, p.nachname, p.email);
      if (old) await crm.personAlsKunde(old.id, { status: "aktiv", ...k });
      else await crm.neuePersonAlsKunde({ ...p, kundenIds: [] }, { status: "aktiv", ...k });
    }
    toast.success("Datensatz angelegt");
    close();
  };
  const f = <T extends Record<string, string>>(
    obj: T,
    set: (v: T) => void,
    key: keyof T,
    label: string,
  ) => (
    <label className="space-y-1 text-sm">
      <span>{label}</span>
      <input
        aria-label={label}
        className={input}
        value={obj[key]}
        onChange={(e) => set({ ...obj, [key]: e.target.value })}
      />
    </label>
  );
  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-2xl overflow-y-auto p-5">
        <DialogHeader className="pr-10">
          <DialogTitle>Neu anlegen</DialogTitle>
          <DialogDescription>
            Person, Kunde oder beide Datensätze gemeinsam anlegen.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex rounded border p-1">
          {(["person", "kunde", "beides"] as Modus[]).map((x) => (
            <button
              key={x}
              onClick={() => setMode(x)}
              className={`flex-1 rounded p-2 text-sm ${mode === x ? "bg-accent" : ""}`}
            >
              {x === "beides" ? "Person zugleich als Kunde" : x === "person" ? "Person" : "Kunde"}
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {mode !== "kunde" && (
            <>
              {f(p, setP, "vorname", "Vorname")}
              {f(p, setP, "nachname", "Nachname")}
              {f(p, setP, "email", "E-Mail")}
              {f(p, setP, "telefonPrivat", "Telefon privat")}
              {f(p, setP, "telefonBeruflich", "Telefon beruflich")}
              {f(p, setP, "funktion", "Funktion")}
              {f(p, setP, "ort", "Ort")}
              {f(p, setP, "strasse", "Straße")}
              {f(p, setP, "plz", "PLZ")}
              {f(p, setP, "land", "Land")}
            </>
          )}
          {mode !== "person" && (
            <>
              {f(k, setK, "name", "Kundenname")}
              {f(k, setK, "uid", "UID")}
              {financeAccess && f(k, setK, "iban", "IBAN")}
              {financeAccess && f(k, setK, "bic", "BIC")}
              {financeAccess && f(k, setK, "bank", "Bank")}
              {f(k, setK, "strasse", "Straße")}
              {f(k, setK, "plz", "PLZ")}
              {f(k, setK, "ort", "Ort")}
              {f(k, setK, "land", "Land")}
              {f(k, setK, "email", "Mail")}
            </>
          )}
        </div>
        <DialogFooter className="mt-5 gap-2 sm:space-x-0">
          <Button variant="outline" onClick={close}>
            Abbrechen
          </Button>
          <Button onClick={() => void create()}>Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
