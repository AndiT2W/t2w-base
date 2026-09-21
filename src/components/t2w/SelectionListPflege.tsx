import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectionBadge, selectionPresentation } from "@/components/t2w/ServiceBadge";
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
  werte,
  anlegen,
  speichern,
  sortieren,
  darstellungOeffnen,
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
  werte: SelectionListValue[];
  anlegen: (name: string) => Promise<void> | void;
  speichern: (id: string, patch: { name?: string; active?: boolean }) => Promise<void> | void;
  sortieren: (gezogen: string, ziel: string) => Promise<void> | void;
  darstellungOeffnen: (id: string) => void;
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

      {werte.map((wert) => (
        <div
          key={wert.id}
          draggable
          onDragStart={() => setGezogen(wert.id)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => {
            if (gezogen && gezogen !== wert.id) void sortieren(gezogen, wert.id);
            setGezogen(null);
          }}
          className="grid min-w-0 gap-2 rounded-md border p-3 lg:grid-cols-[10rem_minmax(12rem,1fr)_9rem_9rem] lg:items-center"
        >
          <span
            aria-label={`${einzahl}vorschau: ${wert.name}`}
            className="flex min-w-0 items-center"
          >
            <SelectionBadge {...wert} />
          </span>
          <Input
            aria-label={`${einzahl} ${wert.name}`}
            defaultValue={wert.name}
            onBlur={(event) => {
              const name = event.target.value.trim();
              if (name && name !== wert.name) void speichern(wert.id, { name });
            }}
          />
          <Button
            type="button"
            variant="outline"
            aria-label={`Darstellung für ${einzahl} ${wert.name}`}
            onClick={() => darstellungOeffnen(wert.id)}
          >
            <span
              className={`size-3 rounded-full border ${selectionPresentation(wert).className}`}
              aria-hidden="true"
            />{" "}
            Darstellung
          </Button>
          <Button
            type="button"
            variant={wert.active ? "outline" : "secondary"}
            onClick={() => void speichern(wert.id, { active: !wert.active })}
          >
            {wert.active ? "Deaktivieren" : "Aktivieren"}
          </Button>
        </div>
      ))}

      {werte.length > 4 && hinzufuegen}
    </section>
  );
}
