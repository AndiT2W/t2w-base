import { useEffect, useId, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { CalendarDays, Package, Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatDatum } from "@/lib/t2w/format";

type Treffer = {
  events: {
    id: string;
    eventCode: string;
    name: string;
    startAt: string;
    organizer?: { name: string } | null;
  }[];
  personen: { id: string; name: string; email?: string | null }[];
  hardware: {
    id: string;
    objectName: string;
    objectNumberSingle?: string | null;
    recipientName: string;
  }[];
};

const LEER: Treffer = { events: [], personen: [], hardware: [] };
/** Wie im Dienst: darunter trifft alles und nichts. */
const MIN_ZEICHEN = 2;

/**
 * Die Suche über alle Module.  Vorher leitete das Feld im Seitenkopf nur auf
 * die Eventliste um — „global" war es dem Namen nach.
 *
 * „Alle anzeigen" führt ins jeweilige Modul mit gesetztem Filter statt auf
 * eine eigene Ergebnisseite: die Modullisten können bereits sortieren,
 * Spalten wählen und exportieren; eine vierte Tabelle mit eigenen Spalten
 * müsste all das nachbauen und gepflegt werden.
 */
export function GlobalSearch() {
  const navigate = useNavigate();
  const listId = useId();
  const [frage, setFrage] = useState("");
  const [treffer, setTreffer] = useState<Treffer>(LEER);
  const [offen, setOffen] = useState(false);
  const huelle = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wort = frage.trim();
    if (wort.length < MIN_ZEICHEN) {
      setTreffer(LEER);
      return;
    }
    // Abbruchsignal statt Entprellzähler: die letzte Eingabe gewinnt, auch
    // wenn eine frühere Antwort später eintrifft.
    const abbruch = new AbortController();
    const zeitgeber = setTimeout(() => {
      fetch(`/api/v1/search?q=${encodeURIComponent(wort)}`, {
        credentials: "include",
        signal: abbruch.signal,
      })
        .then((antwort) => (antwort.ok ? antwort.json() : LEER))
        .then((daten: Treffer) => setTreffer(daten))
        .catch(() => undefined);
    }, 180);
    return () => {
      abbruch.abort();
      clearTimeout(zeitgeber);
    };
  }, [frage]);

  useEffect(() => {
    const ausserhalb = (ereignis: MouseEvent) => {
      if (!huelle.current?.contains(ereignis.target as Node)) setOffen(false);
    };
    document.addEventListener("mousedown", ausserhalb);
    return () => document.removeEventListener("mousedown", ausserhalb);
  }, []);

  const anzahl = treffer.events.length + treffer.personen.length + treffer.hardware.length;
  const zeigen = offen && frage.trim().length >= MIN_ZEICHEN;

  const gruppe = (titel: string, inhalt: React.ReactNode) => (
    <div className="mt-2 first:mt-0">
      <p className="px-1 pb-1 text-[10.5px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
        {titel}
      </p>
      {inhalt}
    </div>
  );

  /** Eine Trefferzeile.  `ziel` fehlt, wo es noch keine Detailseite gibt. */
  const zeile = (
    schluessel: string,
    Symbol: typeof CalendarDays,
    haupt: string,
    neben: string,
    ziel?: { to: "/kontakte" | "/hardware"; search: { q: string } },
  ) => {
    const inhalt = (
      <>
        <Symbol className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="truncate font-medium text-foreground">{haupt}</span>
        {neben && <span className="truncate text-muted-foreground">{neben}</span>}
      </>
    );
    const klasse =
      "flex items-center gap-2 rounded-md px-2 py-1.5 text-[12.5px] no-underline hover:bg-muted";
    return ziel ? (
      <Link key={schluessel} {...ziel} onClick={() => setOffen(false)} className={klasse}>
        {inhalt}
      </Link>
    ) : (
      <span key={schluessel} className={klasse}>
        {inhalt}
      </span>
    );
  };

  return (
    <div ref={huelle} className="relative w-full max-w-[26rem]">
      <form
        role="search"
        onSubmit={(ereignis) => {
          ereignis.preventDefault();
          setOffen(false);
          void navigate({ to: "/veranstaltungen", search: { q: frage, ansicht: "liste" } });
        }}
      >
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          value={frage}
          onChange={(ereignis) => {
            setFrage(ereignis.target.value);
            setOffen(true);
          }}
          onFocus={() => setOffen(true)}
          onKeyDown={(ereignis) => ereignis.key === "Escape" && setOffen(false)}
          role="combobox"
          aria-expanded={zeigen}
          aria-controls={listId}
          aria-label="Global suchen"
          placeholder="Event, Person oder Hardware suchen …"
          className="h-9 pl-8"
        />
      </form>

      {zeigen && (
        <div
          id={listId}
          role="listbox"
          aria-label="Suchtreffer"
          className="absolute left-0 top-[calc(100%+6px)] z-50 w-full rounded-xl border border-border bg-card p-2 shadow-lg"
        >
          {anzahl === 0 ? (
            <p className="px-2 py-3 text-[12.5px] text-muted-foreground">
              Keine Treffer für „{frage.trim()}".
            </p>
          ) : (
            <>
              {treffer.events.length > 0 &&
                gruppe(
                  "Events",
                  <>
                    {treffer.events.map((event) => (
                      <Link
                        key={event.id}
                        to="/events/$eventcode"
                        params={{ eventcode: event.eventCode }}
                        onClick={() => setOffen(false)}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[12.5px] no-underline hover:bg-muted"
                      >
                        <CalendarDays
                          className="size-3.5 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <span className="truncate font-medium text-foreground">{event.name}</span>
                        <span className="truncate text-muted-foreground">
                          {event.eventCode} · {formatDatum(event.startAt.slice(0, 10))}
                        </span>
                      </Link>
                    ))}
                  </>,
                )}
              {treffer.personen.length > 0 &&
                gruppe(
                  "Personen",
                  <>
                    {treffer.personen.map((person) =>
                      zeile(person.id, User, person.name, person.email ?? "", {
                        to: "/kontakte",
                        search: { q: person.name },
                      }),
                    )}
                  </>,
                )}
              {treffer.hardware.length > 0 &&
                gruppe(
                  "Hardware",
                  <>
                    {treffer.hardware.map((stueck) =>
                      zeile(
                        stueck.id,
                        Package,
                        stueck.objectNumberSingle
                          ? `${stueck.objectNumberSingle} · ${stueck.objectName}`
                          : stueck.objectName,
                        stueck.recipientName,
                        { to: "/hardware", search: { q: stueck.recipientName } },
                      ),
                    )}
                  </>,
                )}
              <div className="mt-2 flex flex-wrap gap-1 border-t border-border pt-2">
                {(
                  [
                    ["/veranstaltungen", "Alle Events"],
                    ["/kontakte", "Alle Personen"],
                    ["/hardware", "Alle Hardware"],
                  ] as const
                ).map(([ziel, label]) => (
                  <Link
                    key={ziel}
                    to={ziel}
                    search={{ q: frage.trim() }}
                    onClick={() => setOffen(false)}
                    className="rounded-md px-2 py-1 text-[12px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
