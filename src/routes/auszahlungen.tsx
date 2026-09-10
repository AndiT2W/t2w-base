import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { PageHeader } from "@/components/t2w/PageHeader";
import { Button } from "@/components/ui/button";
import { PayoutCreateForm } from "@/components/t2w/PayoutsPanel";
import { createHttpPayoutAdapter, createPayoutWorkspace } from "@/lib/t2w/payout-workspace";

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
  const scope = useMemo(
    () => ({ q, status: filter, eventId, year, recipientId }),
    [q, filter, eventId, year, recipientId],
  );
  const { rows } = useSyncExternalStore(
    workspace.subscribe,
    workspace.snapshot,
    workspace.snapshot,
  );
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
        krumen={[{ label: "TIME2WIN", to: "/" }]}
        titel="Auszahlungen"
        beschreibung="Nenngeld-Auszahlungen über alle Events"
      />
      <PayoutCreateForm events={events} onCreated={() => void load()} />
      <div className="mb-4 flex flex-wrap gap-2">
        <input
          aria-label="Auszahlungen durchsuchen"
          placeholder="Nummer, Event oder Empfänger …"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm"
        />
        <select
          aria-label="Status filtern"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="">Alle Status</option>
          <option value="OFFEN">Offen</option>
          <option value="VERSENDEN">Mail versenden</option>
          <option value="GESENDET">Mail gesendet</option>
          <option value="AUSBEZAHLT">Ausbezahlt</option>
          <option value="STORNIERT">Storniert</option>
        </select>
        <select
          aria-label="Event filtern"
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="">Alle Events</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.eventCode} · {event.name}
            </option>
          ))}
        </select>
        <input
          aria-label="Jahr filtern"
          placeholder="Jahr"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="w-24 rounded-md border border-border bg-surface px-3 py-2 text-sm"
        />
        <select
          aria-label="Empfänger filtern"
          value={recipientId}
          onChange={(e) => setRecipientId(e.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="">Alle Empfänger</option>
          {recipients.map((recipient) => (
            <option key={recipient.id} value={recipient.id}>
              {recipient.name}
            </option>
          ))}
        </select>
        <Button disabled={!selected.length} onClick={() => void mark()}>
          Für Mailversand markieren ({selected.length})
        </Button>
      </div>
      <div className="mb-3 flex gap-4 text-sm text-muted-foreground">
        {Object.entries(sums).map(([currency, sum]) => (
          <span key={currency}>
            {sum.toFixed(2)} {currency}
          </span>
        ))}
      </div>
      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left">
            <tr>
              <th className="px-3 py-2">
                <input
                  aria-label="Alle sichtbaren auswählen"
                  type="checkbox"
                  checked={rows.length > 0 && selected.length === rows.length}
                  onChange={() =>
                    setSelected(selected.length === rows.length ? [] : rows.map((p) => p.id))
                  }
                />
              </th>
              {[
                "T-Nummer",
                "Event",
                "Empfänger",
                "Betrag",
                "Status",
                "Mail gesendet am",
                "Auszahlungsdatum",
                "Transaktionsbestätigung",
                "Aktionen",
              ].map((x) => (
                <th key={x} className="px-3 py-2">
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-3 py-2">
                  <input
                    aria-label={`${p.payoutNumber} auswählen`}
                    type="checkbox"
                    checked={selected.includes(p.id)}
                    onChange={() => toggle(p.id)}
                  />
                </td>
                <td className="px-3 py-2 font-mono">{p.payoutNumber}</td>
                <td className="px-3 py-2">
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
                <td className="px-3 py-2">{p.recipient?.name ?? "—"}</td>
                <td className="px-3 py-2 tabular-nums">
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
                <td className="px-3 py-2">{status(p)}</td>
                <td className="px-3 py-2">{p.mailSentAt?.slice(0, 10) ?? "—"}</td>
                <td className="px-3 py-2">{p.paidAt?.slice(0, 10) ?? "—"}</td>
                <td className="px-3 py-2">
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
                <td className="px-3 py-2">
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
        </table>
      </div>
    </div>
  );
}
