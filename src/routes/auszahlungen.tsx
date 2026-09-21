import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Receipt, Search } from "lucide-react";
import { PageHeader } from "@/components/t2w/PageHeader";
import { RecordSheet } from "@/components/t2w/RecordSheet";
import { MetricRow, MetricTile } from "@/components/t2w/MetricTile";
import { FilterBar, FilterTrenner } from "@/components/t2w/FilterBar";
import { FilterChip, FilterResetChip } from "@/components/t2w/FilterChip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PayoutCreateForm } from "@/components/t2w/PayoutsPanel";
import { createHttpPayoutAdapter, createPayoutWorkspace } from "@/lib/t2w/payout-workspace";
import { DataTable, SortHeader, useTableSort } from "@/components/t2w/DataTable";
import { formatDatum } from "@/lib/t2w/format";

type Payout = {
  id: string;
  payoutNumber: string;
  amount: string;
  currency: string;
  mailStatus: string;
  paymentStatus: string;
  transactionReference?: string | null;
  mailRecipient?: string | null;
  paidAt?: string | null;
  mailSentAt?: string | null;
  event?: { eventCode: string; name: string } | null;
  recipient?: { name: string } | null;
};
export const Route = createFileRoute("/auszahlungen")({ component: Auszahlungen });
function status(p: Payout) {
  if (p.paymentStatus === "STORNIERT") return "Storniert";
  if (p.paymentStatus === "AUSBEZAHLT") return "Ausbezahlt";
  if (p.mailStatus === "GESENDET") return "Mail gesendet";
  if (p.mailStatus === "VERSENDEN") return "Mail versenden";
  return "Offen";
}

/**
 * Sortierwerte der Auszahlungsspalten.  Auswahl- und Aktionsspalte bleiben
 * ohne Sortierung — sie tragen keinen Wert, nach dem man ordnen würde.
 */
const SPALTEN = [
  { key: "T-Nummer", sortValue: (p: Payout) => p.payoutNumber },
  { key: "Event", sortValue: (p: Payout) => p.event?.name ?? "" },
  { key: "Empfänger", sortValue: (p: Payout) => p.recipient?.name ?? p.mailRecipient ?? "" },
  { key: "Betrag", sortValue: (p: Payout) => Number(p.amount) },
  { key: "Status", sortValue: (p: Payout) => status(p) },
  { key: "Mail gesendet am", sortValue: (p: Payout) => p.mailSentAt ?? "" },
  { key: "Auszahlungsdatum", sortValue: (p: Payout) => p.paidAt ?? "" },
  { key: "Transaktionsbestätigung", sortValue: (p: Payout) => p.transactionReference ?? "" },
] as const;
type Spalte = (typeof SPALTEN)[number]["key"];
function Auszahlungen() {
  const workspace = useMemo(
    () => createPayoutWorkspace<Payout>(createHttpPayoutAdapter<Payout>()),
    [],
  );
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("");
  const [eventId, setEventId] = useState("");
  const [year, setYear] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [events, setEvents] = useState<Array<{ id: string; eventCode: string; name: string }>>([]);
  const [recipients, setRecipients] = useState<Array<{ id: string; name: string }>>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [anlegen, setAnlegen] = useState(false);
  const scope = useMemo(
    () => ({ q, status: filter, eventId, year, recipientId }),
    [q, filter, eventId, year, recipientId],
  );
  const { rows } = useSyncExternalStore(
    workspace.subscribe,
    workspace.snapshot,
    workspace.snapshot,
  );
  const tabelle = useTableSort<Payout, Spalte>(SPALTEN, {
    key: "T-Nummer",
    direction: "asc",
  });
  const zeilen = tabelle.rows(rows);
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
      rows.reduce<Record<string, number>>(
        (a, p) => ((a[p.currency] = (a[p.currency] ?? 0) + Number(p.amount)), a),
        {},
      ),
    [rows],
  );
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
        aktion={<Button onClick={() => setAnlegen(true)}>Auszahlung anlegen</Button>}
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
        {Object.entries(sums).map(([currency, sum]) => (
          <MetricTile
            key={currency}
            icon={Receipt}
            label={`Summe gefiltert (${currency})`}
            wert={sum.toFixed(2)}
            hinweis={`${rows.length} ${rows.length === 1 ? "Beleg" : "Belege"}`}
          />
        ))}
      </MetricRow>

      <FilterBar>
        <label className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Auszahlungen durchsuchen"
            placeholder="Nummer, Event oder Empfänger …"
            className="h-11 w-64 rounded-full pl-8 sm:h-8"
          />
        </label>

        <FilterTrenner />

        <FilterChip
          label="Status"
          ariaLabel="Status filtern"
          value={filter}
          inaktiv=""
          onChange={setFilter}
        >
          <option value="">alle</option>
          <option value="OFFEN">Offen</option>
          <option value="VERSENDEN">Mail versenden</option>
          <option value="GESENDET">Mail gesendet</option>
          <option value="AUSBEZAHLT">Ausbezahlt</option>
          <option value="STORNIERT">Storniert</option>
        </FilterChip>

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
        <DataTable exportName="Auszahlungen">
          <thead className="text-left">
            <tr className="h-[30px]">
              <th className="px-2 py-1">
                <input
                  aria-label="Alle sichtbaren auswählen"
                  type="checkbox"
                  checked={rows.length > 0 && selected.length === rows.length}
                  onChange={() =>
                    setSelected(selected.length === rows.length ? [] : rows.map((p) => p.id))
                  }
                />
              </th>
              {SPALTEN.map((spalte) => (
                <th key={spalte.key} className="px-2 py-1">
                  <SortHeader
                    label={spalte.key}
                    active={tabelle.sort.key === spalte.key}
                    direction={tabelle.sort.direction}
                    onSort={() => tabelle.sortBy(spalte.key)}
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
                <td className="px-2 py-1 font-mono">{p.payoutNumber}</td>
                <td className="px-2 py-1">
                  {p.event ? (
                    <Link
                      className="text-primary hover:underline"
                      to="/events/$eventcode"
                      params={{ eventcode: p.event.eventCode }}
                    >
                      {p.event.name}
                    </Link>
                  ) : (
                    "Event nachzuordnen"
                  )}
                </td>
                <td className="px-2 py-1">{p.recipient?.name ?? "—"}</td>
                <td className="px-2 py-1 tabular-nums">
                  <input
                    aria-label={`${p.payoutNumber} Betrag`}
                    defaultValue={p.amount}
                    onBlur={(e) => {
                      if (e.target.value !== p.amount)
                        void update(p.id, { amount: e.target.value });
                    }}
                    className="w-24 rounded border px-1"
                  />{" "}
                  {p.currency}
                </td>
                <td className="px-2 py-1">{status(p)}</td>
                <td className="px-2 py-1">{p.mailSentAt ? formatDatum(p.mailSentAt) : "—"}</td>
                <td className="px-2 py-1">{p.paidAt ? formatDatum(p.paidAt) : "—"}</td>
                <td className="px-2 py-1">
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
                </td>
                <td className="px-2 py-1">
                  <select
                    aria-label={`${p.payoutNumber} Mailstatus`}
                    value={p.mailStatus}
                    onChange={(e) => void update(p.id, { mailStatus: e.target.value })}
                  >
                    <option value="ENTWURF">Entwurf</option>
                    <option value="VERSENDEN">Mail versenden</option>
                    <option value="GESENDET">Mail gesendet</option>
                  </select>
                  <select
                    aria-label={`${p.payoutNumber} Zahlungsstatus`}
                    value={p.paymentStatus}
                    onChange={(e) => void update(p.id, { paymentStatus: e.target.value })}
                  >
                    <option>OFFEN</option>
                    <option>AUSBEZAHLT</option>
                    <option>STORNIERT</option>
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
