import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { createHttpPayoutAdapter, createPayoutWorkspace } from "@/lib/t2w/payout-workspace";
import { formatDatum } from "@/lib/t2w/format";
import { DataTable, SortHeader, useTableSort } from "@/components/t2w/DataTable";

type P = {
  id: string;
  payoutNumber: string;
  amount: string;
  currency: string;
  mailStatus: string;
  paymentStatus: string;
  mailRecipient?: string | null;
  paidAt?: string | null;
  mailSentAt?: string | null;
  transactionReference?: string | null;
  recipient?: { name: string } | null;
};
type Props = { eventId: string; recipientId?: string | null; recipientEmail?: string | null };

/** Sortierwerte der Auszahlungsspalten; die Aktionsspalte bleibt ungeordnet. */
const SPALTEN = [
  { key: "Nummer", sortValue: (p: P) => p.payoutNumber },
  { key: "Empfänger", sortValue: (p: P) => p.recipient?.name ?? p.mailRecipient ?? "" },
  { key: "Betrag", sortValue: (p: P) => Number(p.amount) },
  { key: "Status", sortValue: (p: P) => label(p) },
  { key: "Maildatum", sortValue: (p: P) => p.mailSentAt ?? "" },
  { key: "Auszahlungsdatum", sortValue: (p: P) => p.paidAt ?? "" },
] as const;
type Spalte = (typeof SPALTEN)[number]["key"];

export type PayoutEventOption = {
  id: string;
  eventCode: string;
  name: string;
  payoutRecipientId?: string | null;
  payoutRecipient?: { email?: string | null } | null;
};

function label(p: P) {
  if (p.paymentStatus === "STORNIERT") return "Storniert";
  if (p.paymentStatus === "AUSBEZAHLT") return "Ausbezahlt";
  if (p.mailStatus === "GESENDET") return "Mail gesendet";
  if (p.mailStatus === "VERSENDEN") return "Mail versenden";
  return "Offen";
}
function statusClasses(p: P) {
  if (p.paymentStatus === "AUSBEZAHLT") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (p.paymentStatus === "STORNIERT") return "border-red-200 bg-red-50 text-red-700";
  if (p.mailStatus === "GESENDET") return "border-blue-200 bg-blue-50 text-blue-700";
  if (p.mailStatus === "VERSENDEN") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}
export function PayoutsPanel({ eventId, recipientId, recipientEmail }: Props) {
  const workspace = useMemo(() => createPayoutWorkspace<P>(createHttpPayoutAdapter<P>()), []);
  const { rows: items } = useSyncExternalStore(
    workspace.subscribe,
    workspace.snapshot,
    workspace.snapshot,
  );
  const tabelle = useTableSort<P, Spalte>(SPALTEN, { key: "Nummer", direction: "asc" });
  const zeilen = tabelle.rows(items);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const scope = useMemo(() => ({ eventId }), [eventId]);
  const load = useCallback(() => workspace.load(scope), [workspace, scope]);
  useEffect(() => {
    void load();
  }, [load]);
  async function create() {
    if (!amount) return;
    await workspace.create(scope, {
      eventId,
      recipientId,
      mailRecipient: recipientEmail,
      amount,
      currency,
    });
    setAmount("");
    await load();
  }
  async function update(id: string, body: Record<string, unknown>) {
    await workspace.update(scope, id, body);
  }
  async function remove(id: string) {
    if (!window.confirm("Auszahlung dauerhaft löschen?")) return;
    await workspace.remove(scope, id);
  }
  return (
    <section aria-label="Auszahlungen" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-medium text-foreground">Auszahlungen</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Neue Auszahlungen anlegen und den Versandstatus bearbeiten.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            aria-label="Auszahlungsbetrag"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Betrag"
            className="w-28 rounded border px-2 py-1"
          />
          <select
            aria-label="Auszahlungswährung"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="rounded border px-2 py-1"
          >
            <option>EUR</option>
            <option>CHF</option>
            <option>USD</option>
          </select>
          <Button onClick={() => void create()}>Auszahlung anlegen</Button>
        </div>
      </div>
      <DataTable exportName="Event-Auszahlungen" className="text-sm">
        <thead className="t2w-table-header">
          <tr className="text-left">
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
            <tr key={p.id} className="border-t align-middle">
              <td className="px-2 py-1 font-mono">{p.payoutNumber}</td>
              <td className="px-2 py-1">
                {p.recipient?.name ?? p.mailRecipient ?? recipientEmail ?? "—"}
              </td>
              <td className="px-2 py-1">
                {p.amount} {p.currency}
              </td>
              <td className="px-2 py-2">
                <span
                  aria-label={`${p.payoutNumber} Status`}
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusClasses(p)}`}
                >
                  {label(p)}
                </span>
              </td>
              <td className="px-2 py-1">{p.mailSentAt ? formatDatum(p.mailSentAt) : "—"}</td>
              <td className="px-2 py-1">{p.paidAt ? formatDatum(p.paidAt) : "—"}</td>
              <td className="px-2 py-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void update(p.id, { mailStatus: "VERSENDEN" })}
                >
                  Für Mail markieren
                </Button>
                {p.paymentStatus === "OFFEN" && p.mailStatus === "GESENDET" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void update(p.id, {
                        paymentStatus: "AUSBEZAHLT",
                        paidAt: new Date().toISOString(),
                      })
                    }
                  >
                    Als ausgezahlt markieren
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => void remove(p.id)}>
                  Löschen
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </section>
  );
}

export function PayoutCreateForm({
  events,
  onCreated,
}: {
  events: PayoutEventOption[];
  onCreated: () => void;
}) {
  const [eventId, setEventId] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("EUR");
  async function create() {
    if (!eventId || !amount) return;
    const event = events.find((e) => e.id === eventId);
    await fetch("/api/v1/payouts", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        recipientId: event?.payoutRecipientId,
        mailRecipient: event?.payoutRecipient?.email,
        amount,
        currency,
      }),
    });
    setAmount("");
    onCreated();
  }
  return (
    <section
      aria-label="Neue Auszahlung"
      className="mb-3 flex flex-wrap items-center gap-2 border-b border-border pb-3"
    >
      <select
        aria-label="Event für neue Auszahlung"
        value={eventId}
        onChange={(e) => setEventId(e.target.value)}
        className="h-8 rounded border border-border bg-background px-2 text-[13px]"
      >
        <option value="">Event auswählen</option>
        {events.map((e) => (
          <option key={e.id} value={e.id}>
            {e.eventCode} · {e.name}
          </option>
        ))}
      </select>
      <input
        aria-label="Neuer Auszahlungsbetrag"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Betrag"
        className="h-8 w-28 rounded border border-border bg-background px-2 text-[13px]"
      />
      <select
        aria-label="Neue Auszahlungswährung"
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        className="h-8 rounded border border-border bg-background px-2 text-[13px]"
      >
        <option>EUR</option>
        <option>CHF</option>
        <option>USD</option>
      </select>
      <Button size="sm" disabled={!eventId || !amount} onClick={() => void create()}>
        Auszahlung anlegen
      </Button>
    </section>
  );
}
