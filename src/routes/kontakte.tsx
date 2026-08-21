import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/t2w/PageHeader";
import { apiContacts, apiCreateContact, apiCreateCustomer, apiCustomers } from "@/lib/t2w/api";

export const Route = createFileRoute("/kontakte")({ component: KundenKontakte });
type Person = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  customerProfile?: { name: string; uid?: string; iban?: string } | null;
};
type Customer = { id: string; name: string; uid?: string; iban?: string; invoiceEmail?: string };

function KundenKontakte() {
  const [tab, setTab] = useState<"kontakte" | "kunden">("kontakte");
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const load = async () => {
    try {
      const [p, c] = await Promise.all([apiContacts(), apiCustomers()]);
      setPeople(p);
      setCustomers(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Laden fehlgeschlagen");
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const visiblePeople = useMemo(
    () =>
      people.filter((p) =>
        `${p.name} ${p.email ?? ""} ${p.phone ?? ""}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [people, query],
  );
  const visibleCustomers = useMemo(
    () =>
      customers.filter((c) =>
        `${c.name} ${c.uid ?? ""} ${c.iban ?? ""}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [customers, query],
  );
  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      if (tab === "kontakte") await apiCreateContact({ name, email, phone });
      else await apiCreateCustomer({ name });
      setName("");
      setEmail("");
      setPhone("");
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Speichern fehlgeschlagen");
    }
  }
  return (
    <div>
      <PageHeader
        krumen={[{ label: "TIME2WIN", to: "/" }]}
        titel="Kunden & Kontakte"
        beschreibung={`${tab === "kontakte" ? visiblePeople.length : visibleCustomers.length} Einträge`}
        suche={{ value: query, onChange: setQuery, placeholder: "Name, E-Mail, UID …" }}
      />
      <div className="mb-4 flex items-center justify-between gap-3">
        <div
          className="flex rounded-md border border-border p-1"
          role="tablist"
          aria-label="Kunden und Kontakte"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "kontakte"}
            onClick={() => setTab("kontakte")}
            className={`rounded px-3 py-1.5 text-sm ${tab === "kontakte" ? "bg-accent font-medium" : ""}`}
          >
            Kontakte
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "kunden"}
            onClick={() => setTab("kunden")}
            className={`rounded px-3 py-1.5 text-sm ${tab === "kunden" ? "bg-accent font-medium" : ""}`}
          >
            Kunden
          </button>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
        >
          {tab === "kontakte" ? "Kontakt anlegen" : "Kunde anlegen"}
        </button>
      </div>
      {showForm && (
        <form
          onSubmit={submit}
          className="mb-4 grid gap-3 rounded-lg border border-border bg-surface p-4 sm:grid-cols-4"
        >
          <input
            aria-label="Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={tab === "kontakte" ? "Name" : "Kundenname"}
            className="rounded border border-border bg-background px-3 py-2 text-sm"
          />
          {tab === "kontakte" && (
            <>
              <input
                aria-label="E-Mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-Mail"
                className="rounded border border-border bg-background px-3 py-2 text-sm"
              />
              <input
                aria-label="Telefon"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Telefon"
                className="rounded border border-border bg-background px-3 py-2 text-sm"
              />
            </>
          )}
          <button type="submit" className="rounded border border-border px-3 py-2 text-sm">
            Speichern
          </button>
        </form>
      )}
      {error && (
        <p
          role="alert"
          className="mb-4 rounded border border-destructive/40 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {tab === "kontakte" ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visiblePeople.map((p) => (
            <article key={p.id} className="rounded-lg border border-border bg-surface p-4">
              <p className="font-medium">{p.name}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {p.email || "Keine E-Mail"} · {p.phone || "Kein Telefon"}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                {p.customerProfile ? `Kunde: ${p.customerProfile.name}` : "Noch kein Kundenprofil"}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visibleCustomers.map((c) => (
            <article key={c.id} className="rounded-lg border border-border bg-surface p-4">
              <p className="font-medium">{c.name}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {c.uid || "Keine UID"} · {c.iban || "Keine IBAN"}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                {c.invoiceEmail || "Keine Rechnungs-E-Mail"}
              </p>
            </article>
          ))}
        </div>
      )}
      {((tab === "kontakte" && !visiblePeople.length) ||
        (tab === "kunden" && !visibleCustomers.length)) && (
        <p className="rounded-lg border border-border bg-surface p-8 text-center text-sm text-muted-foreground">
          Keine Einträge gefunden.
        </p>
      )}
    </div>
  );
}
