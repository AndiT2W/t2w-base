import { useMemo, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, SlidersHorizontal, X } from "lucide-react";
import { PageHeader } from "@/components/t2w/PageHeader";
import { useCrm, passtKunde, passtPerson } from "@/lib/crm/store";
import { KUNDENSTATUS_LABEL, personName, type Kunde, type Person } from "@/lib/crm/types";

export const Route = createFileRoute("/kontakte")({
  validateSearch: (search) => ({ tab: search.tab === "kunden" ? "kunden" as const : "kontakte" as const }),
  component: KundenKontakte,
});
type Auswahl = { art: "person" | "kunde"; id: string } | null;
function Chip({ children, good = false }: { children: ReactNode; good?: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${good ? "border-status-zugesagt/40 bg-status-zugesagt/15" : "border-border bg-secondary text-muted-foreground"}`}
    >
      {children}
    </span>
  );
}
function KundenKontakte() {
  const { personen, kunden, neuePerson, neuerKunde, personAlsKunde, findeDublette } = useCrm();
  const { tab } = Route.useSearch();
  const [suche, setSuche] = useState("");
  const [auswahl, setAuswahl] = useState<Auswahl>(null);
  const [neu, setNeu] = useState(false);
  const [modus, setModus] = useState<"person" | "kunde" | "beides">("person");
  const [vorname, setVorname] = useState("");
  const [nachname, setNachname] = useState("");
  const [email, setEmail] = useState("");
  const [telefon, setTelefon] = useState("");
  const [kundenname, setKundenname] = useState("");
  const [uid, setUid] = useState("");
  const [iban, setIban] = useState("");
  const ps = useMemo(
    () => personen.filter((p) => !suche || passtPerson(p, suche, kunden)),
    [personen, kunden, suche],
  );
  const ks = useMemo(() => kunden.filter((k) => !suche || passtKunde(k, suche)), [kunden, suche]);
  const p = auswahl?.art === "person" ? personen.find((x) => x.id === auswahl.id) : undefined;
  const k = auswahl?.art === "kunde" ? kunden.find((x) => x.id === auswahl.id) : undefined;
  const clear = () => {
    setVorname("");
    setNachname("");
    setEmail("");
    setTelefon("");
    setKundenname("");
    setUid("");
    setIban("");
    setNeu(false);
  };
  const save = () => {
    if (modus !== "kunde" && !vorname && !nachname) return;
    if (modus !== "kunde" && findeDublette(vorname, nachname, email)) return;
    if (modus === "person")
      neuePerson({
        vorname,
        nachname,
        email,
        telefon,
        funktion: "",
        ort: "",
        notiz: "",
        kundenIds: [],
      });
    if (modus === "kunde")
      neuerKunde({
        typ: "firma",
        name: kundenname,
        uid,
        iban,
        bank: "",
        rechnungsAdresse: "",
        rechnungsEmail: "",
        status: "pruefung",
      });
    if (modus === "beides") {
      const id = findeDublette(vorname, nachname, email)?.id;
      if (id)
        personAlsKunde(id, {
          uid,
          iban,
          bank: "",
          rechnungsAdresse: "",
          rechnungsEmail: email,
          status: "pruefung",
        });
    }
    clear();
  };
  return (
    <div>
      <PageHeader
        krumen={[{ label: "Übersicht", to: "/" }]}
        titel="Kunden & Kontakte"
        beschreibung="Personen und Kundenprofile zentral pflegen"
        suche={{
          value: suche,
          onChange: setSuche,
          placeholder: "Name, E-Mail, Telefon, UID, IBAN …",
        }}
        aktion={
          <button
            onClick={() => setNeu(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
          >
            <Plus className="size-4" /> Neu anlegen
          </button>
        }
      />
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2">
          <div className="flex rounded-md border border-border p-1">
            <Link
              to="/kontakte"
              search={{ tab: "kontakte" }}
              aria-pressed={tab === "kontakte"}
              className={`rounded px-3 py-1.5 text-sm ${tab === "kontakte" ? "bg-accent font-medium" : ""}`}
            >
              Kontakte ({ps.length})
            </Link>
            <Link
              to="/kontakte"
              search={{ tab: "kunden" }}
              aria-pressed={tab === "kunden"}
              className={`rounded px-3 py-1.5 text-sm ${tab === "kunden" ? "bg-accent font-medium" : ""}`}
            >
              Kunden ({ks.length})
            </Link>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <SlidersHorizontal className="size-3.5" /> Suche über Stammdaten
          </span>
        </div>
        {tab === "kontakte" ? (
          <Table headers={["Name", "Funktion", "E-Mail", "Telefon", "Kunden", "Kundenprofil"]}>
            {ps.map((x) => (
              <tr
                key={x.id}
                onClick={() => setAuswahl({ art: "person", id: x.id })}
                className="cursor-pointer border-t border-border hover:bg-accent/50"
              >
                <td>{personName(x)}</td>
                <td>{x.funktion || "–"}</td>
                <td>{x.email || "–"}</td>
                <td>{x.telefon || "–"}</td>
                <td>{x.kundenIds.length}</td>
                <td>{x.kundenprofilId ? <Chip good>vorhanden</Chip> : <Chip>nein</Chip>}</td>
              </tr>
            ))}
          </Table>
        ) : (
          <Table headers={["Kunde", "Typ", "UID", "IBAN", "Kontakte", "Status"]}>
            {ks.map((x) => (
              <tr
                key={x.id}
                onClick={() => setAuswahl({ art: "kunde", id: x.id })}
                className="cursor-pointer border-t border-border hover:bg-accent/50"
              >
                <td>{x.name}</td>
                <td>
                  <Chip>{x.typ === "firma" ? "Firma" : "Einzelperson"}</Chip>
                </td>
                <td>{x.uid || "–"}</td>
                <td className="font-mono text-[11px]">{x.iban || "–"}</td>
                <td>{x.kontaktIds.length}</td>
                <td>
                  <Chip good={x.status === "aktiv"}>{KUNDENSTATUS_LABEL[x.status]}</Chip>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>
      {auswahl && (p || k) && (
        <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-xl overflow-y-auto border-l border-border bg-background p-5 shadow-xl">
          <button
            aria-label="Detail schließen"
            onClick={() => setAuswahl(null)}
            className="float-right rounded p-1 hover:bg-accent"
          >
            <X className="size-4" />
          </button>
          <h2 className="mb-5 text-xl font-semibold">{p ? personName(p) : k?.name}</h2>
          {p ? <PersonDetail person={p} /> : <KundeDetail kunde={k!} />}
        </aside>
      )}
      {neu && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
          <div className="w-full max-w-2xl rounded-lg border border-border bg-background p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Neu anlegen</h2>
              <button onClick={clear} aria-label="Dialog schließen">
                <X className="size-4" />
              </button>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Person ist der kanonische Datensatz; ein Kundenprofil ist optional.
            </p>
            <div className="mt-4 flex rounded-md border border-border p-1">
              <button
                onClick={() => setModus("person")}
                className={`flex-1 rounded px-2 py-1.5 text-sm ${modus === "person" ? "bg-accent" : ""}`}
              >
                Person
              </button>
              <button
                onClick={() => setModus("kunde")}
                className={`flex-1 rounded px-2 py-1.5 text-sm ${modus === "kunde" ? "bg-accent" : ""}`}
              >
                Kunde
              </button>
              <button
                onClick={() => setModus("beides")}
                className={`flex-1 rounded px-2 py-1.5 text-sm ${modus === "beides" ? "bg-accent" : ""}`}
              >
                Person zugleich als Kunde
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {modus !== "kunde" && (
                <>
                  <input
                    aria-label="Vorname"
                    placeholder="Vorname"
                    value={vorname}
                    onChange={(e) => setVorname(e.target.value)}
                    className="rounded border border-border px-3 py-2 text-sm"
                  />
                  <input
                    aria-label="Nachname"
                    placeholder="Nachname"
                    value={nachname}
                    onChange={(e) => setNachname(e.target.value)}
                    className="rounded border border-border px-3 py-2 text-sm"
                  />
                  <input
                    aria-label="E-Mail"
                    placeholder="E-Mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded border border-border px-3 py-2 text-sm"
                  />
                  <input
                    aria-label="Telefon"
                    placeholder="Telefon"
                    value={telefon}
                    onChange={(e) => setTelefon(e.target.value)}
                    className="rounded border border-border px-3 py-2 text-sm"
                  />
                </>
              )}
              {modus !== "person" && (
                <>
                  <input
                    aria-label="Kundenname"
                    placeholder="Kundenname"
                    value={kundenname}
                    onChange={(e) => setKundenname(e.target.value)}
                    className="rounded border border-border px-3 py-2 text-sm sm:col-span-2"
                  />
                  <input
                    aria-label="UID"
                    placeholder="UID"
                    value={uid}
                    onChange={(e) => setUid(e.target.value)}
                    className="rounded border border-border px-3 py-2 text-sm"
                  />
                  <input
                    aria-label="IBAN"
                    placeholder="IBAN"
                    value={iban}
                    onChange={(e) => setIban(e.target.value)}
                    className="rounded border border-border px-3 py-2 text-sm"
                  />
                </>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={clear} className="rounded border border-border px-3 py-2 text-sm">
                Abbrechen
              </button>
              <button
                onClick={save}
                className="rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full min-w-[52rem] border-collapse text-xs">
        <thead className="bg-secondary text-left text-[11px] uppercase tracking-wide text-muted-foreground">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-2 py-1.5 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
function PersonDetail({ person }: { person: Person }) {
  return (
    <div className="space-y-5">
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Kontaktdaten
        </h3>
        <dl className="mt-2 grid gap-3 sm:grid-cols-2">
          <dt>
            E-Mail<dd>{person.email || "–"}</dd>
          </dt>
          <dt>
            Telefon<dd>{person.telefon || "–"}</dd>
          </dt>
          <dt>
            Funktion<dd>{person.funktion || "–"}</dd>
          </dt>
          <dt>
            Ort<dd>{person.ort || "–"}</dd>
          </dt>
        </dl>
      </section>
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Kundenprofil
        </h3>
        <p className="mt-2 text-sm">
          {person.kundenprofilId
            ? "Diese Person wird zugleich als Kunde geführt."
            : "Kein Kundenprofil vorhanden."}
        </p>
      </section>
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Eventrollen
        </h3>
        {person.eventRollen.map((r, i) => (
          <p key={i} className="mt-2 rounded border border-border p-2 text-sm">
            <Chip>{r.rolle}</Chip> {r.eventName}
          </p>
        ))}
      </section>
      <p className="rounded border border-dashed border-border p-3 text-xs text-muted-foreground">
        Outlook-/Gmail-Abgleich ist für einen späteren Ausbau vorgesehen.
      </p>
    </div>
  );
}
function KundeDetail({ kunde }: { kunde: Kunde }) {
  return (
    <div className="space-y-5">
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Rechnungsdaten
        </h3>
        <dl className="mt-2 grid gap-3 sm:grid-cols-2">
          <dt>
            Name<dd>{kunde.name}</dd>
          </dt>
          <dt>
            UID<dd>{kunde.uid || "–"}</dd>
          </dt>
          <dt>
            Rechnungsadresse<dd>{kunde.rechnungsAdresse || "–"}</dd>
          </dt>
          <dt>
            Rechnungs-E-Mail<dd>{kunde.rechnungsEmail || "–"}</dd>
          </dt>
        </dl>
      </section>
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Bankdaten
        </h3>
        <dl className="mt-2 grid gap-3 sm:grid-cols-2">
          <dt>
            IBAN<dd className="font-mono">{kunde.iban || "–"}</dd>
          </dt>
          <dt>
            Bank<dd>{kunde.bank || "–"}</dd>
          </dt>
        </dl>
      </section>
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Events
        </h3>
        {kunde.events.map((e, i) => (
          <p key={i} className="mt-2 rounded border border-border p-2 text-sm">
            <Chip>{e.funktion}</Chip> {e.eventName}
          </p>
        ))}
      </section>
    </div>
  );
}
