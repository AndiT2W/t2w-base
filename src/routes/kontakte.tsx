import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/t2w/PageHeader";
import { Button } from "@/components/ui/button";
import { useCrm, passtKunde, passtPerson } from "@/lib/crm/store";
import { KUNDENSTATUS_LABEL, personName, type Kunde, type Person } from "@/lib/crm/types";

export const Route = createFileRoute("/kontakte")({ component: KundenKontakte });
type Auswahl = { art: "person" | "kunde"; id: string } | null;
type Modus = "person" | "kunde" | "beides";
const CUSTOMER_COLUMN_STORAGE_KEY = "t2w-customer-table-columns";
const CUSTOMER_COLUMNS = [
  "Kunde",
  "ID",
  "E-Mail",
  "UID",
  "IBAN",
  "Kontakte",
  "Events",
  "Status",
] as const;
type CustomerColumn = (typeof CUSTOMER_COLUMNS)[number];
const input = "w-full rounded border border-input bg-background px-2 py-1.5 text-sm";
const validEmail = (value: string) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const validPhone = (value: string) => !value || /^[+0-9() ./-]+$/.test(value);
const Chip = ({ children, good = false }: { children: ReactNode; good?: boolean }) => (
  <span
    className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${good ? "border-status-zugesagt/40 bg-status-zugesagt/15" : "border-border bg-secondary text-muted-foreground"}`}
  >
    {children}
  </span>
);

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
  const [tab, setTab] = useState<"kontakte" | "kunden">("kontakte");
  const [q, setQ] = useState("");
  const [only, setOnly] = useState(false);
  const [sel, setSel] = useState<Auswahl>(null);
  const [create, setCreate] = useState(false);
  useEffect(() => {
    if (window.location.search.includes("neu=1")) setCreate(true);
    const kundeId = new URLSearchParams(window.location.search).get("kunde");
    if (kundeId && crm.kunden.some((kunde) => kunde.id === kundeId))
      setSel({ art: "kunde", id: kundeId });
  }, [crm.kunden]);
  function closeCreate() {
    setCreate(false);
    window.history.replaceState({}, "", "/kontakte");
  }
  const people = useMemo(
    () =>
      crm.personen
        .filter((p) => passtPerson(p, q, crm.kunden))
        .filter((p) => !only || !!p.kundenprofilId)
        .sort((a, b) => personName(a).localeCompare(personName(b), "de")),
    [crm.personen, crm.kunden, q, only],
  );
  const customers = useMemo(
    () =>
      crm.kunden
        .filter((k) => passtKunde(k, q))
        .filter((k) => !only || k.status === "aktiv")
        .sort((a, b) => a.name.localeCompare(b.name, "de")),
    [crm.kunden, q, only],
  );
  const p = sel?.art === "person" ? crm.personen.find((x) => x.id === sel.id) : undefined;
  const k = sel?.art === "kunde" ? crm.kunden.find((x) => x.id === sel.id) : undefined;
  return (
    <div>
      <PageHeader
        krumen={[{ label: "Übersicht", to: "/" }]}
        titel="Kunden & Kontakte"
        beschreibung="Personen und Kundenprofile zentral pflegen"
        suche={{ value: q, onChange: setQ, placeholder: "Name, E-Mail, Telefon, UID, IBAN …" }}
      />
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2">
          <a
            href="/kontakte?neu=1"
            className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
          >
            <Plus className="mr-1 inline size-4" />
            Neu anlegen
          </a>
          <div className="flex rounded border border-border p-1">
            <button
              onClick={() => {
                setTab("kontakte");
                setOnly(false);
              }}
              className={`rounded px-3 py-1.5 text-sm ${tab === "kontakte" ? "bg-accent font-medium" : ""}`}
            >
              Kontakte ({people.length})
            </button>
            <button
              onClick={() => {
                setTab("kunden");
                setOnly(false);
              }}
              className={`rounded px-3 py-1.5 text-sm ${tab === "kunden" ? "bg-accent font-medium" : ""}`}
            >
              Kunden ({customers.length})
            </button>
          </div>
          <label className="text-xs text-muted-foreground">
            <input type="checkbox" checked={only} onChange={(e) => setOnly(e.target.checked)} />{" "}
            {tab === "kontakte" ? "nur mit Kundenprofil" : "nur aktive Kunden"}
          </label>
        </div>
        {tab === "kontakte" ? (
          <PeopleTable
            people={people}
            select={(id) => setSel({ art: "person", id })}
            open={() => setCreate(true)}
          />
        ) : (
          <CustomerTable
            customers={customers}
            select={(id) => setSel({ art: "kunde", id })}
            open={() => setCreate(true)}
          />
        )}
        <p className="rounded border border-dashed border-border p-3 text-xs text-muted-foreground">
          Inline-Änderungen werden beim Verlassen eines Feldes gespeichert. Outlook-/Gmail-Abgleich
          ist vorbereitet.
        </p>
      </div>
      {sel && (p || k) && (
        <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-xl overflow-y-auto border-l border-border bg-background p-5 shadow-xl">
          <button
            aria-label="Detail schließen"
            onClick={() => setSel(null)}
            className="float-right"
          >
            <X />
          </button>
          <h2 className="mb-5 text-xl font-semibold">{p ? personName(p) : k?.name}</h2>
          {p ? (
            <>
              <PersonDetail person={p} crm={crm} go={(id) => setSel({ art: "kunde", id })} />
              <AssociationRemover
                label="Kundenzuordnung entfernen"
                items={crm.kundenVonPerson(p).map((x) => [x.id, x.name])}
                remove={(id) => crm.loeseVerknuepfung(p.id, id)}
              />
            </>
          ) : (
            <>
              <CustomerDetail customer={k!} crm={crm} go={(id) => setSel({ art: "person", id })} />
              <AssociationRemover
                label="Kontaktzuordnung entfernen"
                items={crm.kontakteVonKunde(k!.id).map((x) => [x.id, personName(x)])}
                remove={(id) => crm.loeseVerknuepfung(id, k!.id)}
              />
            </>
          )}
        </aside>
      )}
      {create && <CreateDialog crm={crm} close={closeCreate} />}
    </div>
  );
}
function PeopleTable({
  people,
  select,
  open,
}: {
  people: Person[];
  select: (id: string) => void;
  open: () => void;
}) {
  const [sort, setSort] = useState<TableSort>({ key: "Name", direction: "asc" });
  const sortedPeople = sortRows(
    people,
    sort,
    (person) =>
      ({
        Name: personName(person),
        Funktion: person.funktion,
        "E-Mail": person.email,
        Telefon: person.telefonBeruflich || person.telefonPrivat,
        Kunden: person.kundenIds.length,
        Eventrollen: person.eventRollen.length,
        Kundenprofil: person.kundenprofilId ? "ja" : "nein",
      })[sort.key],
  );
  return people.length ? (
    <Table
      h={["Name", "Funktion", "E-Mail", "Telefon", "Kunden", "Eventrollen", "Kundenprofil"]}
      sort={sort}
      onSort={setSort}
    >
      {sortedPeople.map((p) => (
        <tr
          key={p.id}
          onClick={() => select(p.id)}
          className="cursor-pointer border-t border-border hover:bg-accent/50"
        >
          <td>{personName(p)}</td>
          <td>{p.funktion || "–"}</td>
          <td>{p.email || "–"}</td>
          <td>{p.telefonBeruflich || p.telefonPrivat || "–"}</td>
          <td>{p.kundenIds.length}</td>
          <td>{p.eventRollen.length}</td>
          <td>{p.kundenprofilId ? <Chip good>ja</Chip> : <Chip>nein</Chip>}</td>
        </tr>
      ))}
    </Table>
  ) : (
    <Empty text="Keine Kontakte gefunden." open={open} label="Person anlegen" />
  );
}
function CustomerTable({
  customers,
  select,
  open,
}: {
  customers: Kunde[];
  select: (id: string) => void;
  open: () => void;
}) {
  const [sort, setSort] = useState<TableSort>({ key: "Kunde", direction: "asc" });
  const [visibleColumns, setVisibleColumns] = useState<CustomerColumn[]>([...CUSTOMER_COLUMNS]);
  const [columnPickerOpen, setColumnPickerOpen] = useState(false);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CUSTOMER_COLUMN_STORAGE_KEY);
      if (!stored) return;
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const columns = parsed.filter(
          (column): column is CustomerColumn =>
            typeof column === "string" && CUSTOMER_COLUMNS.includes(column as CustomerColumn),
        );
        if (columns.length) setVisibleColumns(columns);
      }
    } catch {
      localStorage.removeItem(CUSTOMER_COLUMN_STORAGE_KEY);
    }
  }, []);
  const toggleColumn = (column: CustomerColumn) => {
    setVisibleColumns((current) => {
      const next = current.includes(column)
        ? current.filter((item) => item !== column)
        : CUSTOMER_COLUMNS.filter((item) => current.includes(item) || item === column);
      localStorage.setItem(CUSTOMER_COLUMN_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };
  const sortedCustomers = sortRows(
    customers,
    sort,
    (customer) =>
      ({
        Kunde: customer.name,
        ID: customer.id,
        "E-Mail": customer.email,
        UID: customer.uid,
        IBAN: customer.iban,
        Kontakte: customer.kontaktIds.length,
        Events: customer.events.length,
        Status: KUNDENSTATUS_LABEL[customer.status],
      })[sort.key],
  );
  return customers.length ? (
    <>
      <div className="relative mb-2 flex justify-end">
        <Button
          type="button"
          size="sm"
          variant="outline"
          aria-expanded={columnPickerOpen}
          onClick={() => setColumnPickerOpen((open) => !open)}
        >
          Spalten auswählen
        </Button>
        {columnPickerOpen && (
          <div className="absolute top-9 z-10 w-48 rounded border border-border bg-background p-2 shadow-md">
            {CUSTOMER_COLUMNS.map((column) => (
              <label
                key={column}
                className="flex cursor-pointer items-center gap-2 px-1 py-1 text-sm"
              >
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(column)}
                  onChange={() => toggleColumn(column)}
                />
                {column}
              </label>
            ))}
          </div>
        )}
      </div>
      <Table
        h={CUSTOMER_COLUMNS.filter((column) => visibleColumns.includes(column))}
        sort={sort}
        onSort={setSort}
      >
        {sortedCustomers.map((k) => (
          <tr
            key={k.id}
            onClick={() => select(k.id)}
            className="cursor-pointer border-t border-border hover:bg-accent/50"
          >
            {visibleColumns.includes("Kunde") && <td>{k.name}</td>}
            {visibleColumns.includes("ID") && (
              <td className="font-mono text-[11px] text-muted-foreground">{k.id}</td>
            )}
            {visibleColumns.includes("E-Mail") && <td>{k.email || "–"}</td>}
            {visibleColumns.includes("UID") && <td>{k.uid || "–"}</td>}
            {visibleColumns.includes("IBAN") && <td>{k.iban || "–"}</td>}
            {visibleColumns.includes("Kontakte") && <td>{k.kontaktIds.length}</td>}
            {visibleColumns.includes("Events") && <td>{k.events.length}</td>}
            {visibleColumns.includes("Status") && (
              <td>
                <Chip good={k.status === "aktiv"}>{KUNDENSTATUS_LABEL[k.status]}</Chip>
              </td>
            )}
          </tr>
        ))}
      </Table>
    </>
  ) : (
    <Empty text="Keine Kunden gefunden." open={open} label="Kunde anlegen" />
  );
}
type TableSort = { key: string; direction: "asc" | "desc" };

function sortRows<T>(rows: T[], sort: TableSort, value: (row: T) => string | number | undefined) {
  return [...rows].sort((a, b) => {
    const left = value(a) ?? "";
    const right = value(b) ?? "";
    const comparison =
      typeof left === "number" && typeof right === "number"
        ? left - right
        : String(left).localeCompare(String(right), "de", { numeric: true });
    return sort.direction === "asc" ? comparison : -comparison;
  });
}

function Table({
  h,
  children,
  sort,
  onSort,
}: {
  h: string[];
  children: ReactNode;
  sort: TableSort;
  onSort: (sort: TableSort) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full min-w-[54rem] text-xs">
        <thead className="bg-secondary text-left text-[11px] uppercase text-muted-foreground">
          <tr>
            {h.map((x) => (
              <th key={x} className="px-2 py-1.5">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 font-semibold hover:text-foreground"
                  onClick={() =>
                    onSort({
                      key: x,
                      direction: sort.key === x && sort.direction === "asc" ? "desc" : "asc",
                    })
                  }
                  aria-label={`${x} sortieren`}
                >
                  {x}
                  {sort.key === x && (
                    <span aria-hidden="true">{sort.direction === "asc" ? "↑" : "↓"}</span>
                  )}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_td]:px-2 [&_td]:py-1">{children}</tbody>
      </table>
    </div>
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
            .map((k) => [k.id, k.name])}
          save={(id) => crm.verknuepfe(person.id, id)}
        />
      </section>
      <section>
        <h3 className="mb-2 font-semibold">Eventrollen ({person.eventRollen.length})</h3>
        {person.eventRollen.map((r) => (
          <p key={r.eventcode + r.rolle} className="rounded border border-border p-2 text-sm">
            <Chip>{r.rolle}</Chip> {r.eventName}
          </p>
        ))}
      </section>
    </div>
  );
}
function CustomerDetail({
  customer,
  crm,
  go,
}: {
  customer: Kunde;
  crm: ReturnType<typeof useCrm>;
  go: (id: string) => void;
}) {
  const contacts = crm.kontakteVonKunde(customer.id);
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
        <Field
          label="IBAN"
          value={customer.iban}
          save={(v) => crm.updateKunde(customer.id, { iban: v })}
        />
        <Field
          label="BIC"
          value={customer.bic}
          save={(v) => crm.updateKunde(customer.id, { bic: v })}
        />
        <Field
          label="Bank"
          value={customer.bank}
          save={(v) => crm.updateKunde(customer.id, { bank: v })}
        />
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
            .map((p) => [p.id, personName(p)])}
          save={(id) => crm.verknuepfe(id, customer.id)}
        />
      </section>
    </div>
  );
}
function AssociationRemover({
  label,
  items,
  remove,
}: {
  label: string;
  items: string[][];
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
  options: string[][];
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
function CreateDialog({ crm, close }: { crm: ReturnType<typeof useCrm>; close: () => void }) {
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
    if (mode !== "kunde" && !p.vorname && !p.nachname)
      return toast.error("Vor- oder Nachname ist erforderlich.");
    if (mode === "kunde" && !k.name) return toast.error("Kundenname ist erforderlich.");
    const email = mode === "kunde" ? k.email : p.email;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return toast.error("Bitte eine gültige Mail-Adresse angeben.");
    if (
      mode !== "kunde" &&
      [p.telefonPrivat, p.telefonBeruflich].some((phone) => phone && !/^[+0-9() ./-]+$/.test(phone))
    )
      return toast.error("Bitte gültige Telefonnummern angeben.");
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
  const f = (
    obj: Record<string, string>,
    set: (v: Record<string, string>) => void,
    key: string,
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
      <div className="w-full max-w-2xl rounded-lg border border-border bg-background p-5 shadow-xl">
        <div className="flex justify-between">
          <h2 className="text-lg font-semibold">Neu anlegen</h2>
          <button aria-label="Dialog schließen" onClick={close}>
            <X />
          </button>
        </div>
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
              {f(k, setK, "iban", "IBAN")}
              {f(k, setK, "bic", "BIC")}
              {f(k, setK, "bank", "Bank")}
              {f(k, setK, "strasse", "Straße")}
              {f(k, setK, "plz", "PLZ")}
              {f(k, setK, "ort", "Ort")}
              {f(k, setK, "land", "Land")}
              {f(k, setK, "email", "Mail")}
            </>
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={close}>
            Abbrechen
          </Button>
          <Button onClick={() => void create()}>Speichern</Button>
        </div>
      </div>
    </div>
  );
}
