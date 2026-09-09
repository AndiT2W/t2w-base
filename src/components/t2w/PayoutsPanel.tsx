import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

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
  const [items, setItems] = useState<P[]>([]);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const load = () =>
    fetch(`/api/v1/payouts?eventId=${eventId}`, { credentials: "include" })
      .then((r) => r.json())
      .then(setItems);
  useEffect(() => {
    void load();
  }, [eventId]);
  async function create() {
    if (!amount) return;
    await fetch("/api/v1/payouts", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        recipientId,
        mailRecipient: recipientEmail,
        amount,
        currency,
      }),
    });
    setAmount("");
    await load();
  }
  async function update(id: string, body: Record<string, unknown>) {
    await fetch(`/api/v1/payouts/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await load();
  }
  async function remove(id: string) {
    if (!window.confirm("Auszahlung dauerhaft löschen?")) return;
    await fetch(`/api/v1/payouts/${id}`, { method: "DELETE", credentials: "include" });
    await load();
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
      <div className="overflow-x-auto rounded border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary text-left">
              <th className="px-2 py-1">Nummer</th>
              <th className="px-2 py-1">Empfänger</th>
              <th className="px-2 py-1">Betrag</th>
              <th className="px-2 py-1">Status</th>
              <th className="px-2 py-1">Maildatum</th>
              <th className="px-2 py-1">Auszahlungsdatum</th>
              <th className="px-2 py-1">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-t align-middle">
                <td className="px-2 py-1 font-mono">{p.payoutNumber}</td>
                <td className="px-2 py-1">
                  {p.recipient?.name ?? p.mailRecipient ?? recipientEmail ?? "—"}
                </td>
                <td className="px-2 py-1">
                  {p.amount} {p.currency}
                </td>
                <td className="px-2 py-2">
                  <span aria-label={`${p.payoutNumber} Status`} className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusClasses(p)}`}>
                    {label(p)}
                  </span>
                </td>
                <td className="px-2 py-1">{p.mailSentAt?.slice(0, 10) ?? "—"}</td>
                <td className="px-2 py-1">{p.paidAt?.slice(0, 10) ?? "—"}</td>
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
                      onClick={() => void update(p.id, { paymentStatus: "AUSBEZAHLT", paidAt: new Date().toISOString() })}
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
        </table>
      </div>
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
    <section aria-label="Neue Auszahlung" className="mb-4 flex flex-wrap gap-2">
      <select
        aria-label="Event für neue Auszahlung"
        value={eventId}
        onChange={(e) => setEventId(e.target.value)}
        className="rounded border px-2 py-1"
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
        className="w-28 rounded border px-2 py-1"
      />
      <select
        aria-label="Neue Auszahlungswährung"
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        className="rounded border px-2 py-1"
      >
        <option>EUR</option>
        <option>CHF</option>
        <option>USD</option>
      </select>
      <Button disabled={!eventId || !amount} onClick={() => void create()}>
        Auszahlung anlegen
      </Button>
    </section>
  );
}
