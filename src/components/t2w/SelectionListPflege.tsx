import { useState } from "react";
import { ChevronRight, GripVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectionBadge } from "@/components/t2w/ServiceBadge";
import type { SelectionListKind, SelectionListValue } from "@/lib/t2w/selection-list-workspace";

/**
 * Eine Pflegemaske für alle sieben Auswahllisten.
 *
 * Vorher stand dieselbe Maske sechsmal in `einstellungen.tsx` — je Liste rund
 * achtzig Zeilen, die sich nur in Beschriftung und Zustandsvariable
 * unterschieden — und ein siebtes Mal als eigene Komponente für die
 * Aufgabenkategorien.  Sieben gleich funktionierende Listen in zwei
 * verschiedenen Masken zu pflegen war genau die Uneinheitlichkeit, die hier
 * verschwinden soll.
 *
 * Die Werte tragen ihre Reihenfolge selbst; gezogen wird auf den Zielplatz.
 */
export function SelectionListPflege({
  kind,
  titel,
  beschreibung,
  einzahl,
  neuLabel,
  vorschauLabel,
  werte,
  anlegen,
  sortieren,
  oeffnen,
}: {
  kind: SelectionListKind;
  titel: string;
  beschreibung: string;
  /** Für die barrierefreien Namen: „Sportart", „Service", … */
  einzahl: string;
  /**
   * Die Beschriftung des Eingabefeldes, etwa „Neue Sportart" oder „Neues
   * Thema".  Das Geschlecht steht nicht in der Endung — es wird genannt,
   * nicht geraten.
   */
  neuLabel: string;
  /**
   * Der Name der Vorschau, etwa „Sportartvorschau" oder „Eventrollenvorschau".
   * Zusammengesetzt wird er genannt, nicht aus der Einzahl geklebt: das Fugen-n
   * folgt keiner Regel, die sich aus der Endung ablesen liesse.
   */
  vorschauLabel: string;
  werte: SelectionListValue[];
  anlegen: (name: string) => Promise<void> | void;
  sortieren: (gezogen: string, ziel: string) => Promise<void> | void;
  /** Öffnet den Wert im Sheet; dort wird er auch gespeichert. */
  oeffnen: (id: string) => void;
}) {
  const [neu, setNeu] = useState("");
  const [gezogen, setGezogen] = useState<string | null>(null);

  const hinzufuegen = (
    <div className="flex gap-2">
      <Input
        aria-label={neuLabel}
        value={neu}
        onChange={(event) => setNeu(event.target.value)}
        placeholder={`${einzahl} hinzufügen`}
      />
      <Button
        type="button"
        aria-label={`${einzahl} hinzufügen`}
        onClick={async () => {
          const name = neu.trim();
          if (!name) return;
          await anlegen(name);
          setNeu("");
        }}
      >
        <Plus className="size-4" />
        Hinzufügen
      </Button>
    </div>
  );

  return (
    <section
      aria-label={titel}
      className="space-y-3 rounded-xl border border-border bg-card p-4"
      data-selection-list={kind}
    >
      <div>
        <h2 className="text-base font-bold text-foreground">{titel}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{beschreibung}</p>
      </div>

      {hinzufuegen}

      {/* Eine Zeile anklicken öffnet den Wert rechts — dieselbe Bewegung wie
          in jeder Liste der Anwendung. Vorher stand der Name in einem Feld in
          der Zeile, Symbol und Farbe in einem Dialog und Aktiv als dritter
          Knopf daneben: drei Wege für einen Datensatz. */}
      <ul className="space-y-1.5">
        {werte.map((wert) => (
          <li
            key={wert.id}
            draggable
            onDragStart={() => setGezogen(wert.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (gezogen && gezogen !== wert.id) void sortieren(gezogen, wert.id);
              setGezogen(null);
            }}
            className="flex min-w-0 items-center gap-2 rounded-md border border-border pl-2 transition-colors hover:bg-accent/40"
          >
            <GripVertical
              className="size-4 shrink-0 cursor-grab text-muted-foreground"
              aria-hidden="true"
            />
            <button
              type="button"
              aria-label={`${einzahl} ${wert.name} bearbeiten`}
              onClick={() => oeffnen(wert.id)}
              className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-md px-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                aria-label={`${vorschauLabel}: ${wert.name}`}
                className="flex min-w-0 items-center"
              >
                <SelectionBadge {...wert} />
              </span>
              <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                {wert.name}
              </span>
              {!wert.active && (
                <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                  Inaktiv
                </span>
              )}
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>

      {werte.length > 4 && hinzufuegen}
    </section>
  );
}
