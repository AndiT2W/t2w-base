import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { payoutStatusLabel, type PayoutStatus } from "@t2w/domain/payout";
import { Ban, CircleCheck, Mail, Plus, Receipt, Search } from "lucide-react";
import { PageHeader } from "@/components/t2w/PageHeader";
import { RecordSheet } from "@/components/t2w/RecordSheet";
import { MetricRow, MetricTile } from "@/components/t2w/MetricTile";
import { FilterBar, FilterTrenner } from "@/components/t2w/FilterBar";
import { FilterChip, FilterResetChip, ToggleChip } from "@/components/t2w/FilterChip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PayoutCreateForm } from "@/components/t2w/PayoutsPanel";
import { createHttpPayoutAdapter, createPayoutWorkspace } from "@/lib/t2w/payout-workspace";
import {
  ColumnPicker,
  DataTable,
  SortHeader,
  TableToolbar,
  useTableBehavior,
} from "@/components/t2w/DataTable";
import { formatDatum } from "@/lib/t2w/format";

type Payout = {
  id: string;
  payoutNumber: string;
  amount: string;
  currency: string;
  status: PayoutStatus;
  transactionReference?: string | null;
  recipientSnapshot?: { name?: string | null; email?: string | null } | null;
  paidAt?: string | null;
  mailSentAt?: string | null;
  event?: { eventCode: string; name: string } | null;
  recipient?: { name: string } | null;
};
/*
 * Wie auf den uebrigen Listen: die Frage kommt als "?q=" von aussen, eine
 * leere steht nicht in der Adresse.
 */
export const Route = createFileRoute("/auszahlungen")({
  validateSearch: (search: Record<string, unknown>) => {
    const frage = typeof search["q"] === "string" ? search["q"] : "";
    return frage ? { q: frage } : {};
  },
  component: Auszahlungen,
});
function status(p: Payout) {
  return payoutStatusLabel(p.status);
}

/**
 * Sortierwerte der Auszahlungsspalten.  Auswahl- und Aktionsspalte bleiben
 * ohne Sortierung — sie tragen keinen Wert, nach dem man ordnen würde.
 */
const SPALTEN_NAMEN = [
  "T-Nummer",
  "Event",
  "Empfänger",
  "Betrag",
  "Status",
  "Mail gesendet am",
  "Auszahlungsdatum",
  "Transaktionsbestätigung",
] as const;
type Spalte = (typeof SPALTEN_NAMEN)[number];
const SORTIERWERT: Record<Spalte, (p: Payout) => string | number> = {
  "T-Nummer": (p) => p.payoutNumber,
  Event: (p) => p.event?.name ?? "",
  Empfänger: (p) =>
    p.recipient?.name ?? p.recipientSnapshot?.name ?? p.recipientSnapshot?.email ?? "",
  Betrag: (p) => Number(p.amount),
  Status: (p) => status(p),
  "Mail gesendet am": (p) => p.mailSentAt ?? "",
  Auszahlungsdatum: (p) => p.paidAt ?? "",
  Transaktionsbestätigung: (p) => p.transactionReference ?? "",
};
const SPALTEN = SPALTEN_NAMEN.map((key) => ({ key, sortValue: SORTIERWERT[key] }));

/** Die Reihenfolge der Chips; "Alle" steht vorne und ist die Grundstellung. */
const STATUS_CHIPS = [
  "Offen",
  "Mail versenden",
  "Versand läuft",
  "Mail gesendet",
  "Ausbezahlt",
  "Storniert",
];
function Auszahlungen() {
  const workspace = useMemo(
    () => createPayoutWorkspace<Payout>(createHttpPayoutAdapter<Payout>()),
    [],
  );
  const { q: frage = "" } = Route.useSearch();
  const [q, setQ] = useState(frage);
  useEffect(() => {
    setQ(frage);
  }, [frage]);
  const [filter, setFilter] = useState("");
  const [eventId, setEventId] = useState("");
  const [year, setYear] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [events, setEvents] = useState<Array<{ id: string; eventCode: string; name: string }>>([]);
  const [recipients, setRecipients] = useState<Array<{ id: string; name: string }>>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [anlegen, setAnlegen] = useState(false);
  /*
   * Der Status filtert hier, nicht im Dienst: die Chips tragen ihre Anzahl,
   * und die kennt nur, wer alle Zustaende geladen hat. Die uebrigen Filter
   * bleiben beim Dienst, sie begrenzen die Menge.
   */
  const scope = useMemo(() => ({ q, eventId, year, recipientId }), [q, eventId, year, recipientId]);
  const { rows } = useSyncExternalStore(
    workspace.subscribe,
    workspace.snapshot,
    workspace.snapshot,
  );
  const tabelle = useTableBehavior<Payout, Spalte>({
    storageKey: "t2w-payout-table-columns",
    columns: SPALTEN,
    initialSort: { key: "T-Nummer", direction: "asc" },
  });
  const tableRef = useRef<HTMLTableElement>(null);
  const gefiltert = useMemo(
    () => (filter ? rows.filter((p) => status(p) === filter) : rows),
    [rows, filter],
  );
  const anzahlJeStatus = useMemo(
    () =>
      rows.reduce<Record<string, number>>((zaehler, p) => {
        const name = status(p);
        zaehler[name] = (zaehler[name] ?? 0) + 1;
        return zaehler;
      }, {}),
    [rows],
  );
  const zeilen = tabelle.rows(gefiltert);
  const load = useCallback(() => workspace.load(scope), [workspace, scope]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    void Promise.all([
      fetch("/api/v1/events?limit=1000", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/v1/organizers", { credentials: "include" }).then((r) => r.json()),
    ]).then(([eventRows, recipientRows]) => {
      setEvents(Array.isArray(eventRows) ? eventRows : []);
      setRecipients(Array.isArray(recipientRows) ? recipientRows : []);
    });
  }, []);
  const sums = useMemo(
    () =>
      gefiltert.reduce<Record<string, number>>(
        (a, p) => ((a[p.currency] = (a[p.currency] ?? 0) + Number(p.amount)), a),
        {},
      ),
    [gefiltert],
  );
  /*
   * Die vier Kacheln des Artboards: was offen ist, was zum Versand
   * bereitliegt, was geflossen ist und was storniert wurde -- jeweils Betrag
   * und Belegzahl.  Sie zaehlen die Menge des gesetzten Jahres- und
   * Eventfilters, nicht die Statusauswahl darunter: sonst zeigte die Kachel
   * "Offen" nach einem Klick auf "Ausbezahlt" eine Null.
   */
  const kennzahlen = useMemo(() => {
    const leer = () => ({ betrag: 0, anzahl: 0 });
    const gruppen: Record<string, { betrag: number; anzahl: number }> = {
      Offen: leer(),
      "Mail versenden": leer(),
      Ausbezahlt: leer(),
      Storniert: leer(),
    };
    for (const p of rows) {
      const ziel =
        p.status === "VERSANDBEREIT" || p.status === "VERSAND_LAEUFT"
          ? "Mail versenden"
          : p.status === "AUSBEZAHLT"
            ? "Ausbezahlt"
            : p.status === "STORNIERT"
              ? "Storniert"
              : "Offen";
      const gruppe = gruppen[ziel];
      if (!gruppe) continue;
      gruppe.betrag += Number(p.amount);
      gruppe.anzahl += 1;
    }
    return gruppen;
  }, [rows]);
  const belege = (anzahl: number) => `${anzahl} ${anzahl === 1 ? "Beleg" : "Belege"}`;
  /**
   * Eine Zelle je Spalte.  Vorher standen die Zellen fest in der Zeile und
   * die Spaltenwahl hatte nichts, woran sie sich haette festhalten koennen.
   */
  function zelle(spalte: Spalte, p: Payout) {
    if (spalte === "T-Nummer") return <span className="font-mono">{p.payoutNumber}</span>;
    if (spalte === "Event")
      return p.event ? (
        <Link
          className="text-primary hover:underline"
          to="/events/$eventcode"
          params={{ eventcode: p.event.eventCode }}
        >
          {p.event.name}
        </Link>
      ) : (
        "Event nachzuordnen"
      );
    if (spalte === "Empfänger") return p.recipient?.name ?? "—";
    if (spalte === "Betrag")
      return (
        <span className="tabular-nums">
          <input
            aria-label={`${p.payoutNumber} Betrag`}
            defaultValue={p.amount}
            onBlur={(e) => {
              if (e.target.value !== p.amount) void update(p.id, { amount: e.target.value });
            }}
            className="w-24 rounded border px-1"
          />{" "}
          {p.currency}
        </span>
      );
    if (spalte === "Status") return status(p);
    if (spalte === "Mail gesendet am") return p.mailSentAt ? formatDatum(p.mailSentAt) : "—";
    if (spalte === "Auszahlungsdatum") return p.paidAt ? formatDatum(p.paidAt) : "—";
    return (
      <input
        aria-label={`${p.payoutNumber} Transaktionsbestätigung`}
        defaultValue={p.transactionReference ?? ""}
        placeholder="—"
        onBlur={(e) => {
          if (e.target.value !== (p.transactionReference ?? ""))
            void update(p.id, { transactionReference: e.target.value });
        }}
        className="w-32 rounded border px-1"
      />
    );
  }
  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }
  async function mark() {
    if (
      !selected.length ||
      !window.confirm(`${selected.length} Auszahlung(en) für Mailversand markieren?`)
    )
      return;
    await workspace.markForMail(scope, selected);
    setSelected([]);
  }
  async function update(id: string, changes: Record<string, string>) {
    await workspace.update(scope, id, changes);
  }
  async function remove(id: string) {
    if (!window.confirm("Auszahlung dauerhaft löschen?")) return;
    await workspace.remove(scope, id);
  }
  return (
    <div>
      <PageHeader
        krumen={[{ label: "Übersicht", to: "/" }]}
        titel="Auszahlungen"
        beschreibung="Nenngeld-Auszahlungen über alle Events"
        aktion={
          <Button onClick={() => setAnlegen(true)}>
            <Plus className="size-4" />
            Auszahlung anlegen
          </Button>
        }
      />
      {/* Anlegen oeffnet dasselbe Sheet wie ein Beleg, nur leer -- statt eines
          Formulars, das die Liste dauerhaft nach unten schob. */}
      <RecordSheet
        open={anlegen}
        onOpenChange={setAnlegen}
        titel="Auszahlung anlegen"
        beschreibung="Nenngeld-Auszahlung für ein Event erfassen"
        marke={
          <span
            aria-hidden="true"
            className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-muted"
          >
            <Receipt className="size-5 text-table-header-foreground" />
          </span>
        }
      >
        <PayoutCreateForm
          events={events}
          onCreated={() => {
            void load();
            setAnlegen(false);
          }}
        />
      </RecordSheet>

      <MetricRow>
        <MetricTile
          icon={Receipt}
          label="Offen"
          wert={kennzahlen["Offen"]!.betrag.toFixed(2)}
          hinweis={belege(kennzahlen["Offen"]!.anzahl)}
          {...(kennzahlen["Offen"]!.anzahl > 0 ? { ton: "warn" as const } : {})}
        />
        <MetricTile
          icon={Mail}
          label="Zum Versand markiert"
          wert={kennzahlen["Mail versenden"]!.betrag.toFixed(2)}
          hinweis={belege(kennzahlen["Mail versenden"]!.anzahl)}
        />
        <MetricTile
          icon={CircleCheck}
          label={`Ausbezahlt ${year || "gesamt"}`}
          wert={kennzahlen["Ausbezahlt"]!.betrag.toFixed(2)}
          hinweis={belege(kennzahlen["Ausbezahlt"]!.anzahl)}
        />
        <MetricTile
          icon={Ban}
          label={`Storniert ${year || "gesamt"}`}
          wert={kennzahlen["Storniert"]!.betrag.toFixed(2)}
          hinweis={belege(kennzahlen["Storniert"]!.anzahl)}
        />
      </MetricRow>

      <FilterBar
        werkzeuge={
          <TableToolbar
            tableRef={tableRef}
            exportName="Auszahlungen"
            columnPicker={
              <ColumnPicker
                columns={SPALTEN_NAMEN}
                visibleColumns={tabelle.visibleColumns}
                toggleColumn={tabelle.toggleColumn}
                moveColumn={tabelle.moveColumn}
              />
            }
          />
        }
      >
        {/* Kein eigenes Suchfeld mehr: das Artboard filtert hier ueber die
            Statuschips und Event, Empfaenger, Jahr.  Eine von aussen
            mitgebrachte Frage bleibt als abwaehlbarer Chip sichtbar. */}
        {q.trim() && (
          <>
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

            <FilterTrenner />
          </>
        )}

        {/* Chips mit Anzahl statt eines Auswahlfelds: wie viele Belege offen
            sind, ist die erste Frage auf dieser Seite -- sie soll nicht erst
            nach dem Aufklappen zu sehen sein. */}
        <ToggleChip aktiv={filter === ""} onToggle={() => setFilter("")}>
          Alle <span className="tabular-nums text-muted-foreground">{rows.length}</span>
        </ToggleChip>
        {STATUS_CHIPS.map((name) => (
          <ToggleChip
            key={name}
            aktiv={filter === name}
            onToggle={() => setFilter(filter === name ? "" : name)}
          >
            {name}{" "}
            <span className="tabular-nums text-muted-foreground">{anzahlJeStatus[name] ?? 0}</span>
          </ToggleChip>
        ))}

        <FilterChip
          label="Event"
          ariaLabel="Event filtern"
          value={eventId}
          inaktiv=""
          onChange={setEventId}
        >
          <option value="">alle</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.eventCode} · {event.name}
            </option>
          ))}
        </FilterChip>

        <FilterChip
          label="Empfänger"
          ariaLabel="Empfänger filtern"
          value={recipientId}
          inaktiv=""
          onChange={setRecipientId}
        >
          <option value="">alle</option>
          {recipients.map((recipient) => (
            <option key={recipient.id} value={recipient.id}>
              {recipient.name}
            </option>
          ))}
        </FilterChip>

        <label className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-input bg-card px-3 text-sm text-muted-foreground md:min-h-8">
          Jahr
          <input
            aria-label="Jahr filtern"
            placeholder="alle"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-16 bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>

        <FilterResetChip
          count={
            (q ? 1 : 0) +
            (filter ? 1 : 0) +
            (eventId ? 1 : 0) +
            (recipientId ? 1 : 0) +
            (year ? 1 : 0)
          }
          onReset={() => {
            setQ("");
            setFilter("");
            setEventId("");
            setRecipientId("");
            setYear("");
          }}
        />
      </FilterBar>

      {/* Die Sammelaktion erscheint erst, wenn etwas ausgewaehlt ist -- vorher
          stand ein dauerhaft graues Knopf-Paar ohne Bezug in der Filterzeile. */}
      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-primary bg-primary/10 px-3.5 py-2.5">
          <span className="text-sm text-foreground">
            <strong className="font-bold">
              {selected.length} {selected.length === 1 ? "Auszahlung" : "Auszahlungen"}
            </strong>{" "}
            ausgewählt
          </span>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
              Auswahl aufheben
            </Button>
            <Button size="sm" onClick={() => void mark()}>
              Für Mailversand markieren
            </Button>
          </div>
        </div>
      )}

      <div>
        <DataTable exportName="Auszahlungen" tools="extern" ref={tableRef}>
          <thead className="text-left">
            <tr className="h-[30px]">
              <th className="px-2 py-1">
                <input
                  aria-label="Alle sichtbaren auswählen"
                  type="checkbox"
                  checked={zeilen.length > 0 && selected.length === zeilen.length}
                  onChange={() =>
                    setSelected(selected.length === zeilen.length ? [] : zeilen.map((p) => p.id))
                  }
                />
              </th>
              {tabelle.visibleColumns.map((spalte) => (
                <th key={spalte} className="px-2 py-1">
                  <SortHeader
                    label={spalte}
                    active={tabelle.sort.key === spalte}
                    direction={tabelle.sort.direction}
                    onSort={() => tabelle.sortBy(spalte)}
                  />
                </th>
              ))}
              <th className="px-2 py-1">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {zeilen.map((p) => (
              <tr key={p.id} className="h-[34px] border-t border-border">
                <td className="px-2 py-1">
                  <input
                    aria-label={`${p.payoutNumber} auswählen`}
                    type="checkbox"
                    checked={selected.includes(p.id)}
                    onChange={() => toggle(p.id)}
                  />
                </td>
                {tabelle.visibleColumns.map((spalte) => (
                  <td key={spalte} className="px-2 py-1">
                    {zelle(spalte, p)}
                  </td>
                ))}
                <td className="px-2 py-1">
                  <select
                    aria-label={`${p.payoutNumber} Status`}
                    value={p.status}
                    disabled={p.status === "VERSAND_LAEUFT"}
                    onChange={(e) => void update(p.id, { status: e.target.value })}
                  >
                    <option value="ENTWURF">Entwurf</option>
                    <option value="VERSANDBEREIT">Mail versenden</option>
                    {p.status === "VERSAND_LAEUFT" && (
                      <option value="VERSAND_LAEUFT">Versand läuft</option>
                    )}
                    {p.status === "MAIL_GESENDET" && (
                      <option value="MAIL_GESENDET">Mail gesendet</option>
                    )}
                    <option value="AUSBEZAHLT">Ausbezahlt</option>
                    <option value="STORNIERT">Storniert</option>
                  </select>
                  <Button variant="ghost" size="sm" onClick={() => void remove(p.id)}>
                    Löschen
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </div>
    </div>
  );
}
