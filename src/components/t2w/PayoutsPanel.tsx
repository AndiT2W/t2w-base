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
    <section aria-label="Auszahlungen" className="space-y-3">
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
              <tr key={p.id} className="border-t">
                <td className="px-2 py-1 font-mono">{p.payoutNumber}</td>
                <td className="px-2 py-1">
                  {p.recipient?.name ?? p.mailRecipient ?? recipientEmail ?? "—"}
                </td>
                <td className="px-2 py-1">
                  {p.amount} {p.currency}
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
                    aria-label={`${p.payoutNumber} Status`}
                    value={p.paymentStatus}
                    onChange={(e) =>
                      void update(p.id, {
                        paymentStatus: e.target.value,
                        paidAt:
                          e.target.value === "AUSBEZAHLT"
                            ? (p.paidAt ?? new Date().toISOString())
                            : p.paidAt,
                      })
                    }
                  >
                    <option value="OFFEN">{label({ ...p, paymentStatus: "OFFEN" })}</option>
                    <option value="AUSBEZAHLT">Ausbezahlt</option>
                    <option value="STORNIERT">Storniert</option>
                  </select>
                  <span className="ml-2">{label(p)}</span>
                </td>
                <td className="px-2 py-1">{p.mailSentAt?.slice(0, 10) ?? "—"}</td>
                <td className="px-2 py-1">{p.paidAt?.slice(0, 10) ?? "—"}</td>
                <td className="px-2 py-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void update(p.id, { mailStatus: "VERSENDEN" })}
                  >
                    Für Mail markieren
                  </Button>
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
