import { useEffect, useMemo, useState, type ReactNode } from "react";
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
const input = "w-full rounded border border-input bg-background px-2 py-1.5 text-sm";
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
}: {
  label: string;
  value: string;
  save: (v: string) => void;
  area?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  const commit = () => {
    if (draft !== value) {
      save(draft.trim());
      toast.success(`${label} gespeichert`);
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
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
        />
      ) : (
        <input
          aria-label={label}
          className={input}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
        />
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
  }, []);
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
      {create && <CreateDialog crm={crm} close={() => setCreate(false)} />}
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
  return people.length ? (
    <Table h={["Name", "Funktion", "E-Mail", "Telefon", "Kunden", "Eventrollen", "Kundenprofil"]}>
      {people.map((p) => (
        <tr
          key={p.id}
          onClick={() => select(p.id)}
          className="cursor-pointer border-t border-border hover:bg-accent/50"
        >
          <td>{personName(p)}</td>
          <td>{p.funktion || "–"}</td>
          <td>{p.email || "–"}</td>
          <td>{p.telefon || "–"}</td>
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
  return customers.length ? (
    <Table h={["Kunde", "Typ", "UID", "IBAN", "Kontakte", "Events", "Status"]}>
      {customers.map((k) => (
        <tr
          key={k.id}
          onClick={() => select(k.id)}
          className="cursor-pointer border-t border-border hover:bg-accent/50"
        >
          <td>{k.name}</td>
          <td>
            <Chip>{k.typ === "firma" ? "Firma" : "Einzelperson"}</Chip>
          </td>
          <td>{k.uid || "–"}</td>
          <td>{k.iban || "–"}</td>
          <td>{k.kontaktIds.length}</td>
          <td>{k.events.length}</td>
          <td>
            <Chip good={k.status === "aktiv"}>{KUNDENSTATUS_LABEL[k.status]}</Chip>
          </td>
        </tr>
      ))}
    </Table>
  ) : (
    <Empty text="Keine Kunden gefunden." open={open} label="Kunde anlegen" />
  );
}
function Table({ h, children }: { h: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full min-w-[54rem] text-xs">
        <thead className="bg-secondary text-left text-[11px] uppercase text-muted-foreground">
          <tr>
            {h.map((x) => (
              <th key={x} className="px-2 py-1.5">
                {x}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
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
        />
        <Field
          label="Telefon"
          value={person.telefon}
          save={(v) => crm.updatePerson(person.id, { telefon: v })}
        />
        <Field
          label="Ort"
          value={person.ort}
          save={(v) => crm.updatePerson(person.id, { ort: v })}
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
            <option value="pruefung">In Prüfung</option>
            <option value="inaktiv">Inaktiv</option>
          </select>
        </label>
        <Field
          label="UID-Nummer"
          value={customer.uid}
          save={(v) => crm.updateKunde(customer.id, { uid: v })}
        />
        <Field
          label="Rechnungs-E-Mail"
          value={customer.rechnungsEmail}
          save={(v) => crm.updateKunde(customer.id, { rechnungsEmail: v })}
        />
        <div className="sm:col-span-2">
          <Field
            label="Rechnungsadresse"
            area
            value={customer.rechnungsAdresse}
            save={(v) => crm.updateKunde(customer.id, { rechnungsAdresse: v })}
          />
        </div>
        <Field
          label="IBAN"
          value={customer.iban}
          save={(v) => crm.updateKunde(customer.id, { iban: v })}
        />
        <Field
          label="Bank"
          value={customer.bank}
          save={(v) => crm.updateKunde(customer.id, { bank: v })}
        />
      </div>
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
  save: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const visible = options.filter(([, name]) =>
    name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <div className="mt-3 space-y-2">
      <input
        aria-label={`${label} suchen`}
        className={input}
        value={query}
        placeholder={`${label} suchen …`}
        onChange={(e) => setQuery(e.target.value)}
      />
      <select
        aria-label={label}
        defaultValue=""
        className={input}
        onChange={(e) => {
          if (e.target.value) save(e.target.value);
          e.currentTarget.value = "";
        }}
      >
        <option value="">{label} …</option>
        {visible.map(([id, name]) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}
function CreateDialog({ crm, close }: { crm: ReturnType<typeof useCrm>; close: () => void }) {
  const [mode, setMode] = useState<Modus>("person");
  const [p, setP] = useState({
    vorname: "",
    nachname: "",
    email: "",
    telefon: "",
    funktion: "",
    ort: "",
    notiz: "",
  });
  const [k, setK] = useState({
    name: "",
    uid: "",
    iban: "",
    bank: "",
    rechnungsAdresse: "",
    rechnungsEmail: "",
  });
  const create = () => {
    if (mode !== "kunde" && !p.vorname && !p.nachname)
      return toast.error("Vor- oder Nachname ist erforderlich.");
    if (mode === "kunde" && !k.name) return toast.error("Kundenname ist erforderlich.");
    if (mode === "person") crm.neuePerson({ ...p, kundenIds: [] });
    else if (mode === "kunde") crm.neuerKunde({ typ: "firma", status: "pruefung", ...k });
    else {
      const old = crm.findeDublette(p.vorname, p.nachname, p.email);
      if (old) crm.personAlsKunde(old.id, { status: "pruefung", ...k });
      else {
        const n = { ...p, kundenIds: [] };
        crm.neuePerson(n);
        const id = crm.findeDublette(p.vorname, p.nachname, p.email)?.id;
        if (id) crm.personAlsKunde(id, { status: "pruefung", ...k });
      }
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
              {f(p, setP, "telefon", "Telefon")}
              {f(p, setP, "funktion", "Funktion")}
              {f(p, setP, "ort", "Ort")}
            </>
          )}
          {mode !== "person" && (
            <>
              {f(k, setK, "name", "Kundenname")}
              {f(k, setK, "uid", "UID")}
              {f(k, setK, "iban", "IBAN")}
              {f(k, setK, "bank", "Bank")}
              {f(k, setK, "rechnungsEmail", "Rechnungs-E-Mail")}
            </>
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={close}>
            Abbrechen
          </Button>
          <Button onClick={create}>Speichern</Button>
        </div>
      </div>
    </div>
  );
}
