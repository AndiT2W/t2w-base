import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronRight, Plus, Search, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Segment, segmentFeld } from "@/components/t2w/Segment";
import { Feld } from "@/components/t2w/DetailKarte";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/t2w/PageHeader";
import { RecordSheet } from "@/components/t2w/RecordSheet";
import { FilterBar, FilterTrenner } from "@/components/t2w/FilterBar";
import { FilterChip, ToggleChip } from "@/components/t2w/FilterChip";
import { apiUsers, type ManagedUser } from "@/lib/t2w/users";
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

/*
 * Die globale Suche schickt eine Frage als `?q=` hierher.  Bis 22.09.2026 las
 * die Seite den Parameter nicht: ein Klick auf einen Personentreffer landete
 * auf der ungefilterten Liste, und mit dem Wegfall des eigenen Suchfeldes tat
 * sich gar nichts mehr.
 */
export const Route = createFileRoute("/kontakte")({
  validateSearch: (search: Record<string, unknown>) => {
    // Eine leere Frage steht nicht in der Adresse: sonst haengt an jedem Link
    // auf diese Seite ein "?q=" ohne Inhalt.
    const frage = typeof search["q"] === "string" ? search["q"] : "";
    return frage ? { q: frage } : {};
  },
  component: KundenKontakte,
});
type Auswahl = { art: "person" | "kunde"; id: string } | null;
type Modus = "person" | "kunde" | "beides";
const CUSTOMER_COLUMN_STORAGE_KEY = "t2w-customer-table-columns";
const CUSTOMER_COLUMNS = [
  "Kunde",
  "Zu Händen",
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
function peopleCell(person: Person, column: PeopleColumn, kunden: Kunde[]): ReactNode {
  switch (column) {
    case "Name": {
      // Das Artboard stellt Initialen vor den Namen und darunter die
      // Organisation: in einer Liste mit 800 Kontakten sagt "Sabine Kern"
      // allein zu wenig, um die richtige Sabine zu finden.
      const organisation = kunden.find((kunde) => person.kundenIds.includes(kunde.id))?.name;
      return (
        <span className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-bold text-table-header-foreground"
          >
            {initialen(personName(person))}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium text-foreground">{personName(person)}</span>
            {organisation && (
              <span className="block truncate text-xs text-muted-foreground">{organisation}</span>
            )}
          </span>
        </span>
      );
    }
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
    case "Zu Händen":
      return customer.zuHaenden || "–";
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

/** Zwei Buchstaben als Marke im Sheetkopf — dieselbe Form wie im Entwurf. */
function initialen(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((teil) => teil[0]?.toUpperCase() ?? "")
    .join("");
}

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
/**
 * Veranstalterkonten: welcher Kunde sich anmelden kann und in welchem Zustand
 * sein Konto ist. Gepflegt werden die Konten in den Einstellungen; hier stehen
 * sie, weil die Frage "hat dieser Veranstalter einen Zugang?" beim Kunden
 * aufkommt, nicht in der Benutzerverwaltung.
 */
function OrganizerAccounts({ konten, kunden }: { konten: ManagedUser[]; kunden: Kunde[] }) {
  if (konten.length === 0)
    return (
      <p className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
        Kein Veranstalterkonto gefunden.
      </p>
    );
  const zustand: Record<ManagedUser["status"], string> = {
    ACTIVE: "Aktiv",
    INVITED: "Eingeladen",
    DISABLED: "Gesperrt",
  };
  return (
    <DataTable exportName="Veranstalterkonten" tools="extern">
      <thead className="t2w-table-header">
        <tr>
          <th>Name</th>
          <th>E-Mail</th>
          <th>Kunde</th>
          <th>Zustand</th>
        </tr>
      </thead>
      <tbody>
        {konten.map((konto) => {
          const kunde = kunden.find((eintrag) => eintrag.id === konto.organizerId);
          return (
            <tr key={konto.id}>
              <td className="font-medium text-foreground">{konto.displayName}</td>
              <td>{konto.email}</td>
              <td>{kunde?.name ?? "—"}</td>
              <td>
                <Chip good={konto.status === "ACTIVE"}>{zustand[konto.status]}</Chip>
              </td>
            </tr>
          );
        })}
      </tbody>
    </DataTable>
  );
}

function KundenKontakte() {
  const crm = useCrm();
  const { currentUser } = useT2W();
  const [tab, setTab] = useState<"kontakte" | "kunden" | "konten">("kontakte");
  const [rolle, setRolle] = useState("alle");
  const [eventFilter, setEventFilter] = useState("alle");
  const [kundeFilter, setKundeFilter] = useState("alle");
  const [ohneKunde, setOhneKunde] = useState(false);
  const [nurKonto, setNurKonto] = useState(false);
  const [kundenStatus, setKundenStatus] = useState("alle");
  /**
   * Veranstalterkonten sind Anmeldekonten, keine Stammdaten: sie liegen in
   * der Benutzerverwaltung, die nur Admins lesen duerfen. Fuer alle anderen
   * gibt es den Reiter und den Filter deshalb gar nicht -- ausgegraut waere
   * eine Tuer, die sich nie oeffnet.
   */
  const darfKonten = currentUser.role === "ADMIN";
  const [konten, setKonten] = useState<ManagedUser[]>([]);
  useEffect(() => {
    if (!darfKonten) return;
    let abgemeldet = false;
    apiUsers()
      .then((liste) => {
        if (!abgemeldet) setKonten(liste.filter((benutzer) => benutzer.role === "ORGANIZER"));
      })
      .catch(() => undefined);
    return () => {
      abgemeldet = true;
    };
  }, [darfKonten]);
  const kontoKundenIds = useMemo(
    () => new Set(konten.map((benutzer) => benutzer.organizerId).filter(Boolean) as string[]),
    [konten],
  );
  // Spaltenzustand beider Tabellen liegt hier, damit die Werkzeuge auf
  // Höhe der Tab-Leiste stehen können. Es ist immer nur eine Tabelle
  // gemountet, deshalb genügt eine Referenz für den Export.
  const peopleTable = usePeopleTable();
  const customerTable = useCustomerTable(crm.personen);
  const tableRef = useRef<HTMLTableElement>(null);
  const { q: frage = "" } = Route.useSearch();
  const [q, setQ] = useState(frage);
  // Ein zweiter Treffer aus der globalen Suche kommt als neue Adresse an,
  // waehrend die Seite schon steht.
  useEffect(() => {
    setQ(frage);
  }, [frage]);
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
  }
  const people = useMemo(
    () =>
      crm.personen
        .filter((p) => passtPerson(p, q, crm.kunden))
        .filter((p) => rolle === "alle" || p.eventRollen.some((r) => r.rolle === rolle))
        .filter(
          (p) => eventFilter === "alle" || p.eventRollen.some((r) => r.eventcode === eventFilter),
        )
        .filter((p) => kundeFilter === "alle" || p.kundenIds.includes(kundeFilter))
        .filter((p) => !ohneKunde || p.kundenIds.length === 0)
        .filter((p) => !nurKonto || p.kundenIds.some((id) => kontoKundenIds.has(id)))
        .sort((a, b) => personName(a).localeCompare(personName(b), "de")),
    [
      crm.personen,
      crm.kunden,
      q,
      rolle,
      eventFilter,
      kundeFilter,
      ohneKunde,
      nurKonto,
      kontoKundenIds,
    ],
  );
  const customers = useMemo(
    () =>
      crm.kunden
        .filter((k) => passtKunde(k, q))
        .filter((k) => kundenStatus === "alle" || k.status === kundenStatus)
        .filter((k) => !nurKonto || kontoKundenIds.has(k.id))
        .sort((a, b) => a.name.localeCompare(b.name, "de")),
    [crm.kunden, q, kundenStatus, nurKonto, kontoKundenIds],
  );
  /** Nur Rollen und Events, die tatsaechlich vorkommen -- ein Filter ins Leere hilft niemandem. */
  const rollen = useMemo(
    () => [...new Set(crm.personen.flatMap((p) => p.eventRollen.map((r) => r.rolle)))].sort(),
    [crm.personen],
  );
  const eventWahl = useMemo(() => {
    const paare = new Map<string, string>();
    for (const person of crm.personen)
      for (const rolle of person.eventRollen) paare.set(rolle.eventcode, rolle.eventName);
    return [...paare].sort((a, b) => a[1].localeCompare(b[1], "de"));
  }, [crm.personen]);
  const sichtbareKonten = useMemo(() => {
    const suche = q.trim().toLowerCase();
    return konten
      .filter(
        (benutzer) =>
          !suche ||
          `${benutzer.displayName} ${benutzer.email}`.toLowerCase().includes(suche) ||
          (crm.kunden.find((kunde) => kunde.id === benutzer.organizerId)?.name ?? "")
            .toLowerCase()
            .includes(suche),
      )
      .sort((a, b) => a.displayName.localeCompare(b.displayName, "de"));
  }, [konten, q, crm.kunden]);
  const p = sel?.art === "person" ? crm.personen.find((x) => x.id === sel.id) : undefined;
  const k = sel?.art === "kunde" ? crm.kunden.find((x) => x.id === sel.id) : undefined;
  /*
   * Der Datensatz wird als Ganzes gespeichert, nicht Feld fuer Feld beim
   * Verlassen: so steht es im Artboard, und so verhaelt sich auch das
   * Eventdetail.  Damit gibt es etwas zu verwerfen -- "Abbrechen" schliesst
   * das Sheet und laesst die Aenderungen fallen.
   */
  const [entwurf, setEntwurf] = useState<Partial<Person>>({});
  const [speichert, setSpeichert] = useState(false);
  useEffect(() => {
    setEntwurf({});
  }, [sel?.id]);
  const [kundenEntwurf, setKundenEntwurf] = useState<Partial<Kunde>>({});
  useEffect(() => {
    setKundenEntwurf({});
  }, [sel?.id]);
  const kundeWerte = k ? { ...k, ...kundenEntwurf } : undefined;
  const kundeDirty = Object.keys(kundenEntwurf).length > 0;
  async function kundeSpeichern() {
    if (!k) return;
    if (!validEmail(kundeWerte!.email)) {
      toast.error("Bitte eine gültige Mail-Adresse angeben.");
      return;
    }
    setSpeichert(true);
    try {
      await crm.updateKunde(k.id, kundenEntwurf);
      setKundenEntwurf({});
      toast.success("Änderungen gespeichert.");
    } catch {
      toast.error("Änderungen konnten nicht gespeichert werden.");
    } finally {
      setSpeichert(false);
    }
  }
  const personWerte = p ? { ...p, ...entwurf } : undefined;
  const personDirty = Object.keys(entwurf).length > 0;
  async function personSpeichern() {
    if (!p) return;
    if (!validEmail(personWerte!.email)) {
      toast.error("Bitte eine gültige Mail-Adresse angeben.");
      return;
    }
    if (!validPhone(personWerte!.telefonPrivat) || !validPhone(personWerte!.telefonBeruflich)) {
      toast.error("Bitte eine gültige Telefonnummer angeben.");
      return;
    }
    setSpeichert(true);
    try {
      await crm.updatePerson(p.id, entwurf);
      setEntwurf({});
      toast.success("Änderungen gespeichert.");
    } catch {
      toast.error("Änderungen konnten nicht gespeichert werden.");
    } finally {
      setSpeichert(false);
    }
  }
  return (
    <div>
      <PageHeader
        krumen={[{ label: "Übersicht", to: "/" }]}
        titel="Kunden & Kontakte"
        beschreibung="Stammdaten: Kontakte pflegen und Kundenprofile für Organisationen und Abrechnung verwalten"
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
        <FilterBar
          werkzeuge={
            <div className="hidden md:block">
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
          }
        >
          {/* Dieselbe Segmentleiste wie auf den uebrigen Listen: Unterkante am
              Balken, gruener Unterstrich am aktiven Feld. */}
          <Segment label="Kontaktansicht" className="shrink-0">
            {(
              [
                ["kontakte", `Kontakte (${people.length})`],
                ["kunden", `Kunden (${customers.length})`],
                ...(darfKonten
                  ? ([["konten", `Veranstalterkonten (${sichtbareKonten.length})`]] as const)
                  : []),
              ] as const
            ).map(([wert, beschriftung]) => (
              <button
                key={wert}
                type="button"
                role="tab"
                aria-selected={tab === wert}
                onClick={() => setTab(wert as typeof tab)}
                className={segmentFeld(tab === wert)}
              >
                {beschriftung}
              </button>
            ))}
          </Segment>

          <FilterTrenner />

          {/* Kein eigenes Suchfeld mehr: das Artboard fuehrt die Suche nur
              einmal, oben in der Kopfzeile ueber alle Module.  Eine offene
              Suche bleibt als abwaehlbarer Chip sichtbar, sonst waere nicht zu
              sehen, warum die Liste kurz ist. */}
          {q.trim() && (
            <button
              type="button"
              onClick={() => setQ("")}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-primary bg-primary/10 px-3 text-sm font-medium sm:min-h-8"
            >
              <Search className="size-3.5" aria-hidden="true" />
              <span className="max-w-48 truncate">Suche: {q}</span>
              <span aria-hidden="true">×</span>
              <span className="sr-only">Suche zurücksetzen</span>
            </button>
          )}

          {/* Die Chips gehoeren zur Liste darunter: der Kontaktreiter filtert
              nach Rolle, Event und Kunde, der Kundenreiter nach Status. Die
              Kontenliste traegt nur die Suche -- mehr gibt es dort nicht zu
              unterscheiden. */}
          {tab === "kontakte" && (
            <>
              <FilterChip
                label="Rolle"
                ariaLabel="Rolle filtern"
                value={rolle}
                inaktiv="alle"
                onChange={setRolle}
              >
                <option value="alle">Alle Rollen</option>
                {rollen.map((wert) => (
                  <option key={wert} value={wert}>
                    {wert}
                  </option>
                ))}
              </FilterChip>
              <FilterChip
                label="Event"
                ariaLabel="Event filtern"
                value={eventFilter}
                inaktiv="alle"
                onChange={setEventFilter}
              >
                <option value="alle">Alle Events</option>
                {eventWahl.map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </FilterChip>
              <FilterChip
                label="Kunde"
                ariaLabel="Kunde filtern"
                value={kundeFilter}
                inaktiv="alle"
                onChange={setKundeFilter}
              >
                <option value="alle">Alle Kunden</option>
                {crm.kunden
                  .slice()
                  .sort((a, b) => a.name.localeCompare(b.name, "de"))
                  .map((kunde) => (
                    <option key={kunde.id} value={kunde.id}>
                      {kunde.name}
                    </option>
                  ))}
              </FilterChip>
              <ToggleChip aktiv={ohneKunde} onToggle={() => setOhneKunde(!ohneKunde)}>
                Ohne Kundenbezug
              </ToggleChip>
            </>
          )}
          {tab === "kunden" && (
            <FilterChip
              label="Status"
              ariaLabel="Kundenstatus filtern"
              value={kundenStatus}
              inaktiv="alle"
              onChange={setKundenStatus}
            >
              <option value="alle">Alle Status</option>
              {Object.entries(KUNDENSTATUS_LABEL).map(([wert, label]) => (
                <option key={wert} value={wert}>
                  {label}
                </option>
              ))}
            </FilterChip>
          )}
          {darfKonten && tab !== "konten" && (
            <ToggleChip aktiv={nurKonto} onToggle={() => setNurKonto(!nurKonto)}>
              Nur mit Veranstalterkonto
            </ToggleChip>
          )}
        </FilterBar>
        {tab === "kontakte" ? (
          <PeopleTable
            people={people}
            kunden={crm.kunden}
            select={(id) => setSel({ art: "person", id })}
            open={() => setCreate(true)}
            table={peopleTable}
            tableRef={tableRef}
          />
        ) : tab === "konten" ? (
          <OrganizerAccounts konten={sichtbareKonten} kunden={crm.kunden} />
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
        {tab !== "konten" && (
          <p className="rounded border border-dashed border-border p-3 text-xs text-muted-foreground">
            Eine Zeile anklicken öffnet den Datensatz rechts; gespeichert wird dort.
            Outlook-/Gmail-Abgleich ist vorbereitet.
          </p>
        )}
      </div>
      {sel && (p || k) && (
        <RecordSheet
          open
          onOpenChange={(offen) => !offen && setSel(null)}
          dirty={p ? personDirty : kundeDirty}
          speichern={() => void (p ? personSpeichern() : kundeSpeichern())}
          speicherLabel={speichert ? "Wird gespeichert …" : "Änderungen speichern"}
          titel={p ? personName(p) : (k?.name ?? "")}
          beschreibung={
            p ? "Kontakt · Stammdaten und Zuordnungen" : "Kunde · Stammdaten und Zuordnungen"
          }
          marke={
            <span
              aria-hidden="true"
              className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-sm font-bold text-table-header-foreground"
            >
              {initialen(p ? personName(p) : (k?.name ?? ""))}
            </span>
          }
          nebenaktion={
            <DeleteAction
              label={p ? "Kontakt löschen" : "Kunde löschen"}
              onDelete={async () => {
                if (p) await crm.deletePerson(p.id);
                else await crm.deleteKunde(k!.id);
                setSel(null);
              }}
            />
          }
        >
          {p ? (
            <>
              <PersonDetail
                werte={personWerte!}
                setzen={(feld, wert) => setEntwurf((alt) => ({ ...alt, [feld]: wert }))}
                person={p}
                crm={crm}
                go={(id) => setSel({ art: "kunde", id })}
              />
            </>
          ) : (
            <>
              <CustomerDetail
                werte={kundeWerte!}
                setzen={(feld, wert) => setKundenEntwurf((alt) => ({ ...alt, [feld]: wert }))}
                customer={k!}
                crm={crm}
                go={(id) => setSel({ art: "person", id })}
                financeAccess={currentUser.financeAccess}
              />
            </>
          )}
        </RecordSheet>
      )}
      {create && (
        <CreateDialog
          crm={crm}
          close={closeCreate}
          financeAccess={currentUser.financeAccess}
          ausloeser={createTriggerRef}
        />
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
  kunden,
  select,
  open,
  table,
  tableRef,
}: {
  people: Person[];
  kunden: Kunde[];
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
              <td key={column}>{peopleCell(p, column, kunden)}</td>
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
          "Zu Händen": customer.zuHaenden,
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
/**
 * Ein Abschnitt im Datensatz, wie ihn das Artboard zeichnet: eine kurze
 * Versalüberschrift über der Feldgruppe.  Vorher lagen alle elf Felder eines
 * Kontakts in einem Block — was zur Person gehört und was zur Zugehörigkeit,
 * war nur an den Beschriftungen zu erkennen.
 */
function Abschnitt({ titel, children }: { titel: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-[11px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
        {titel}
      </h3>
      {children}
    </section>
  );
}

/**
 * Eine Eventzeile im Datensatz: Statuspunkt, Name, Zeitraum, Pfeil.  Das
 * Artboard führt sie als anklickbare Zeile statt als Kette von Chips.
 */
function EventZeile({
  eventcode,
  name,
  zusatz,
  chips,
}: {
  eventcode: string;
  name: string;
  zusatz?: string;
  chips: ReactNode;
}) {
  return (
    <a
      href={`/events/${eventcode}`}
      className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/40 px-2.5 py-2 hover:bg-accent/50"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] font-semibold text-foreground">{name}</span>
        <span className="block truncate text-[11.5px] text-muted-foreground">
          {zusatz ?? eventcode}
        </span>
      </span>
      <span className="flex shrink-0 flex-wrap items-center gap-1">{chips}</span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </a>
  );
}

function PersonDetail({
  werte,
  setzen,
  person,
  crm,
  go,
}: {
  werte: Person;
  setzen: (feld: keyof Person, wert: string) => void;
  person: Person;
  crm: ReturnType<typeof useCrm>;
  go: (id: string) => void;
}) {
  const assigned = crm.kundenVonPerson(person);
  const events = groupPersonEventRoles(person.eventRollen);
  return (
    <div className="space-y-4">
      <Abschnitt titel="Person">
        <div className="grid gap-3 sm:grid-cols-2">
          <Feld label="Vorname" htmlFor="k-vorname">
            <Input
              id="k-vorname"
              value={werte.vorname}
              onChange={(e) => setzen("vorname", e.target.value)}
            />
          </Feld>
          <Feld label="Nachname" htmlFor="k-nachname">
            <Input
              id="k-nachname"
              value={werte.nachname}
              onChange={(e) => setzen("nachname", e.target.value)}
            />
          </Feld>
          <Feld label="E-Mail" htmlFor="k-email">
            <Input
              id="k-email"
              type="email"
              value={werte.email}
              onChange={(e) => setzen("email", e.target.value)}
            />
          </Feld>
          <Feld label="Telefon" htmlFor="k-telefon-beruflich">
            <Input
              id="k-telefon-beruflich"
              value={werte.telefonBeruflich}
              onChange={(e) => setzen("telefonBeruflich", e.target.value)}
            />
          </Feld>
          <Feld label="Telefon privat" htmlFor="k-telefon-privat">
            <Input
              id="k-telefon-privat"
              value={werte.telefonPrivat}
              onChange={(e) => setzen("telefonPrivat", e.target.value)}
            />
          </Feld>
        </div>
      </Abschnitt>

      <Abschnitt titel="Anschrift">
        <div className="grid gap-3 sm:grid-cols-2">
          <Feld label="Straße" htmlFor="k-strasse">
            <Input
              id="k-strasse"
              value={werte.strasse}
              onChange={(e) => setzen("strasse", e.target.value)}
            />
          </Feld>
          <Feld label="Ort" htmlFor="k-ort">
            <Input id="k-ort" value={werte.ort} onChange={(e) => setzen("ort", e.target.value)} />
          </Feld>
          <Feld label="PLZ" htmlFor="k-plz">
            <Input id="k-plz" value={werte.plz} onChange={(e) => setzen("plz", e.target.value)} />
          </Feld>
          <Feld label="Land" htmlFor="k-land">
            <Input
              id="k-land"
              value={werte.land}
              onChange={(e) => setzen("land", e.target.value)}
            />
          </Feld>
        </div>
      </Abschnitt>

      <Abschnitt titel="Zugehörigkeit">
        {/* Kunde und Position stehen wie im Artboard nebeneinander.  Der Kunde
            bleibt eine Liste von Chips statt einer Auswahl: eine Person kann
            zu mehreren Kunden gehoeren. */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Feld label={`Kunde${assigned.length > 1 ? ` (${assigned.length})` : ""}`}>
            <div className="flex min-h-9 flex-wrap items-center gap-1.5">
              {assigned.map((k) => (
                // Zuordnen und Loesen stehen am selben Chip; vorher lag das Loesen
                // als eigener Block unter den Events, weit weg von dem, was es
                // betrifft.
                <span
                  key={k.id}
                  className="inline-flex min-h-8 items-center rounded-full border border-border bg-muted/40 pl-3 text-sm"
                >
                  <button type="button" onClick={() => go(k.id)} className="hover:underline">
                    {k.name}
                  </button>
                  <button
                    type="button"
                    aria-label={`Kundenzuordnung ${k.name} entfernen`}
                    onClick={() => void crm.loeseVerknuepfung(person.id, k.id)}
                    className="px-2 text-muted-foreground hover:text-destructive"
                  >
                    ×
                  </button>
                </span>
              ))}
              {assigned.length === 0 && (
                <p className="text-sm text-muted-foreground">Kein Kunde zugeordnet.</p>
              )}
            </div>
            <Assign
              label="Kunde zuordnen"
              options={crm.kunden
                .filter((k) => !person.kundenIds.includes(k.id))
                .map((k) => [k.id, k.name] as const)}
              save={(id) => crm.verknuepfe(person.id, id)}
            />
          </Feld>
          <Feld label="Position" htmlFor="k-funktion">
            <Input
              id="k-funktion"
              value={werte.funktion}
              onChange={(e) => setzen("funktion", e.target.value)}
            />
          </Feld>
        </div>
      </Abschnitt>

      <Abschnitt titel="Notiz">
        <Textarea
          aria-label="Notiz"
          rows={3}
          value={werte.notiz}
          onChange={(e) => setzen("notiz", e.target.value)}
        />
      </Abschnitt>

      <Abschnitt titel={`Events (${events.length})`}>
        {events.length ? (
          <div className="space-y-1.5">
            {events.map((event) => (
              <EventZeile
                key={event.eventcode}
                eventcode={event.eventcode}
                name={event.eventName}
                chips={event.rollen.map((rolle) => (
                  <Chip key={rolle}>{rolle}</Chip>
                ))}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Keine Events zugeordnet.</p>
        )}
      </Abschnitt>
    </div>
  );
}

function CustomerDetail({
  werte,
  setzen,
  customer,
  crm,
  go,
  financeAccess,
}: {
  werte: Kunde;
  setzen: (feld: keyof Kunde, wert: string) => void;
  customer: Kunde;
  crm: ReturnType<typeof useCrm>;
  go: (id: string) => void;
  financeAccess: boolean;
}) {
  const contacts = crm.kontakteVonKunde(customer.id);
  const events = groupCustomerEvents(customer.events);
  return (
    <div className="space-y-4">
      <Abschnitt titel="Organisation">
        <div className="grid gap-3 sm:grid-cols-2">
          <Feld label="Kundenname" htmlFor="ku-name">
            <Input
              id="ku-name"
              value={werte.name}
              onChange={(e) => setzen("name", e.target.value)}
            />
          </Feld>
          <Feld label="Status">
            <Select
              value={werte.status}
              onValueChange={(wert) => setzen("status", wert as Kunde["status"])}
            >
              <SelectTrigger aria-label="Status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aktiv">Aktiv</SelectItem>
                <SelectItem value="inaktiv">Inaktiv</SelectItem>
              </SelectContent>
            </Select>
          </Feld>
          <Feld label="UID-Nummer" htmlFor="ku-uid">
            <Input id="ku-uid" value={werte.uid} onChange={(e) => setzen("uid", e.target.value)} />
          </Feld>
          <Feld label="Mail" htmlFor="ku-mail">
            <Input
              id="ku-mail"
              type="email"
              value={werte.email}
              onChange={(e) => setzen("email", e.target.value)}
            />
          </Feld>
        </div>
      </Abschnitt>

      <Abschnitt titel="Anschrift">
        <div className="grid gap-3 sm:grid-cols-2">
          <Feld label="Zu Händen" htmlFor="ku-zu-haenden">
            <Input
              id="ku-zu-haenden"
              value={werte.zuHaenden ?? ""}
              onChange={(e) => setzen("zuHaenden", e.target.value)}
            />
          </Feld>
          <Feld label="Straße" htmlFor="ku-strasse">
            <Input
              id="ku-strasse"
              value={werte.strasse}
              onChange={(e) => setzen("strasse", e.target.value)}
            />
          </Feld>
          <Feld label="Ort" htmlFor="ku-ort">
            <Input id="ku-ort" value={werte.ort} onChange={(e) => setzen("ort", e.target.value)} />
          </Feld>
          <Feld label="PLZ" htmlFor="ku-plz">
            <Input id="ku-plz" value={werte.plz} onChange={(e) => setzen("plz", e.target.value)} />
          </Feld>
          <Feld label="Land" htmlFor="ku-land">
            <Input
              id="ku-land"
              value={werte.land}
              onChange={(e) => setzen("land", e.target.value)}
            />
          </Feld>
        </div>
      </Abschnitt>

      {financeAccess && (
        <Abschnitt titel="Bankverbindung">
          <div className="grid gap-3 sm:grid-cols-2">
            <Feld label="IBAN" htmlFor="ku-iban">
              <Input
                id="ku-iban"
                value={werte.iban}
                onChange={(e) => setzen("iban", e.target.value)}
                className="font-mono"
              />
            </Feld>
            <Feld label="BIC" htmlFor="ku-bic">
              <Input
                id="ku-bic"
                value={werte.bic}
                onChange={(e) => setzen("bic", e.target.value)}
                className="font-mono"
              />
            </Feld>
            <Feld label="Bank" htmlFor="ku-bank">
              <Input
                id="ku-bank"
                value={werte.bank}
                onChange={(e) => setzen("bank", e.target.value)}
              />
            </Feld>
          </div>
        </Abschnitt>
      )}

      <Abschnitt titel={`Kontakte (${contacts.length})`}>
        <Feld label="Hauptansprechperson">
          <Select
            value={werte.primaryContactId ?? "keine"}
            onValueChange={(wert) =>
              void crm.updateKunde(customer.id, {
                primaryContactId: wert === "keine" ? null : wert,
              })
            }
          >
            <SelectTrigger aria-label="Hauptansprechperson">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="keine">Keine Hauptansprechperson</SelectItem>
              {contacts.map((person) => (
                <SelectItem key={person.id} value={person.id}>
                  {personName(person)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Feld>
        <div className="flex flex-wrap gap-1.5">
          {contacts.map((person) => (
            <span
              key={person.id}
              className="inline-flex min-h-8 items-center rounded-full border border-border bg-muted/40 pl-3 text-sm"
            >
              <button type="button" onClick={() => go(person.id)} className="hover:underline">
                {personName(person)}
              </button>
              <button
                type="button"
                aria-label={`Kontaktzuordnung ${personName(person)} entfernen`}
                onClick={() => void crm.loeseVerknuepfung(person.id, customer.id)}
                className="px-2 text-muted-foreground hover:text-destructive"
              >
                ×
              </button>
            </span>
          ))}
          {contacts.length === 0 && (
            <p className="text-sm text-muted-foreground">Kein Kontakt zugeordnet.</p>
          )}
        </div>
        <Assign
          label="Kontakt zuordnen"
          options={crm.personen
            .filter((person) => !person.kundenIds.includes(customer.id))
            .map((person) => [person.id, personName(person)] as const)}
          save={(id) => crm.verknuepfe(id, customer.id)}
        />
      </Abschnitt>

      <Abschnitt titel={`Events (${events.length})`}>
        {events.length ? (
          <div className="space-y-1.5">
            {events.map((event) => (
              <EventZeile
                key={event.eventcode}
                eventcode={event.eventcode}
                name={event.eventName}
                chips={event.funktionen.map((funktion) => (
                  <Chip key={funktion}>{customerEventFunctionLabel[funktion]}</Chip>
                ))}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Keine Events zugeordnet.</p>
        )}
      </Abschnitt>
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
  ausloeser,
}: {
  crm: ReturnType<typeof useCrm>;
  close: () => void;
  financeAccess: boolean;
  /** Die Schaltflaeche, die den Dialog geoeffnet hat -- siehe unten. */
  ausloeser: React.RefObject<HTMLAnchorElement | null>;
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
    zuHaenden: "",
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
      {/* Der Dialog haengt an der Adresse, nicht an einem Ausloeser, den die
          Bibliothek kennt: ihr eigener Fokussprung landete deshalb auf
          <body>, und wer mit der Tastatur arbeitet, stand nach dem Schliessen
          wieder am Seitenanfang.  Der Fokus gehoert hierher, weil die
          Bibliothek erst danach aufraeumt -- ein spaeterer Aufruf wuerde
          wieder ueberschrieben. */}
      <DialogContent
        onCloseAutoFocus={(ereignis) => {
          ereignis.preventDefault();
          ausloeser.current?.focus();
        }}
        className="max-h-[calc(100dvh-2rem)] max-w-2xl overflow-y-auto p-5"
      >
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
              {f(k, setK, "zuHaenden", "Zu Händen")}
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
