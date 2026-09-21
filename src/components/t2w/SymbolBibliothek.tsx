import { useEffect, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  apiSymbolArchivieren,
  apiSymbole,
  apiSymbolHochladen,
  symbolQuelle,
  symbolWert,
  type Symbolakte,
} from "@/lib/t2w/icons";
import { cn } from "@/lib/utils";

/**
 * Die eigenen Symbole: hochladen, auswählen, archivieren.
 *
 * Sie steht neben dem festen Symbolraster im selben Dialog, nicht auf einer
 * eigenen Seite — wer ein Symbol sucht und keines passendes findet, will es
 * an genau dieser Stelle hochladen, nicht erst woanders hingehen.
 *
 * Gelöscht wird nie, nur archiviert: ein Symbol kann in sieben Auswahllisten
 * stecken, und ein gelöschtes hinterließe dort eine leere Fläche. Dieselbe
 * Regel wie „inaktiv" bei den Auswahllistenwerten selbst.
 */
export function SymbolBibliothek({
  gewaehlt,
  waehlen,
  darfPflegen,
}: {
  /** Der gespeicherte Wert des Auswahllistenwerts, etwa `upload:<uuid>`. */
  gewaehlt?: string | null | undefined;
  waehlen: (wert: string) => void;
  /** Hochladen und Archivieren sind Adminrechte; Ansehen und Wählen nicht. */
  darfPflegen: boolean;
}) {
  const [symbole, setSymbole] = useState<Symbolakte[]>([]);
  const [laedt, setLaedt] = useState(true);
  const [ueberfahren, setUeberfahren] = useState(false);
  const [arbeitet, setArbeitet] = useState(false);
  const dateiwahl = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let abgemeldet = false;
    apiSymbole()
      .then((liste) => {
        if (!abgemeldet) setSymbole(liste);
      })
      .catch(() => {
        if (!abgemeldet) setSymbole([]);
      })
      .finally(() => {
        if (!abgemeldet) setLaedt(false);
      });
    return () => {
      abgemeldet = true;
    };
  }, []);

  async function hochladen(dateien: FileList | File[]) {
    const liste = [...dateien];
    if (liste.length === 0) return;
    setArbeitet(true);
    for (const datei of liste) {
      try {
        const neu = await apiSymbolHochladen(datei);
        setSymbole((bisher) => [neu, ...bisher.filter((s) => s.id !== neu.id)]);
        waehlen(symbolWert(neu.id));
        toast.success(`„${neu.name}" hochgeladen und gewählt.`);
        if (!neu.monochrome)
          toast.info(`„${neu.name}" ist mehrfarbig und nimmt die gewählte Farbe nicht an.`);
      } catch (fehler) {
        // Der Dienst nennt den Grund; ihn zu verschlucken wäre die
        // unfreundlichste Art, eine Datei abzulehnen.
        toast.error(fehler instanceof Error ? fehler.message : "Hochladen fehlgeschlagen.");
      }
    }
    setArbeitet(false);
  }

  async function archivieren(symbol: Symbolakte) {
    try {
      await apiSymbolArchivieren(symbol.id, false);
      setSymbole((bisher) => bisher.filter((s) => s.id !== symbol.id));
      toast.success(`„${symbol.name}" archiviert.`);
    } catch {
      toast.error("Das Symbol konnte nicht archiviert werden.");
    }
  }

  return (
    <div className="space-y-2">
      {laedt ? (
        <p className="text-sm text-muted-foreground">Symbole werden geladen …</p>
      ) : symbole.length > 0 ? (
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
          {symbole.map((symbol) => {
            const wert = symbolWert(symbol.id);
            const aktiv = gewaehlt === wert;
            return (
              <span key={symbol.id} className="group relative">
                <button
                  type="button"
                  aria-label={symbol.name}
                  aria-pressed={aktiv}
                  title={symbol.monochrome ? symbol.name : `${symbol.name} · nicht einfärbbar`}
                  onClick={() => waehlen(wert)}
                  className={cn(
                    "grid min-h-11 w-full place-items-center rounded-md border p-2 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    aktiv ? "border-primary bg-primary/10" : "border-border",
                  )}
                >
                  <img
                    src={symbolQuelle(symbol.id)}
                    alt=""
                    aria-hidden="true"
                    className="size-5 object-contain"
                  />
                </button>
                {darfPflegen && (
                  <button
                    type="button"
                    aria-label={`${symbol.name} archivieren`}
                    onClick={() => void archivieren(symbol)}
                    className="absolute -right-1.5 -top-1.5 hidden size-5 place-items-center rounded-full border border-border bg-card text-xs leading-none text-muted-foreground shadow-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-focus-within:grid group-hover:grid"
                  >
                    ×
                  </button>
                )}
              </span>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Noch keine eigenen Symbole.</p>
      )}

      {darfPflegen && (
        <div
          onDragOver={(ereignis) => {
            ereignis.preventDefault();
            setUeberfahren(true);
          }}
          onDragLeave={() => setUeberfahren(false)}
          onDrop={(ereignis) => {
            ereignis.preventDefault();
            setUeberfahren(false);
            void hochladen(ereignis.dataTransfer.files);
          }}
          className={cn(
            "flex flex-col items-center gap-1.5 rounded-lg border border-dashed px-4 py-5 text-center transition-colors",
            ueberfahren ? "border-primary bg-primary/5" : "border-input",
          )}
        >
          {arbeitet ? (
            <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
          ) : (
            <Upload className="size-5 text-muted-foreground" aria-hidden="true" />
          )}
          <p className="text-sm text-foreground">
            Eigenes Symbol hierher ziehen
            <Button
              type="button"
              variant="link"
              className="h-auto px-1 py-0 align-baseline text-sm"
              onClick={() => dateiwahl.current?.click()}
            >
              oder auswählen
            </Button>
          </p>
          <p className="text-xs text-muted-foreground">
            SVG oder PNG, quadratisch, höchstens 50 KB. Einfarbige Symbole nehmen die gewählte Farbe
            an.
          </p>
          <input
            ref={dateiwahl}
            type="file"
            accept="image/svg+xml,image/png"
            multiple
            className="sr-only"
            aria-label="Symboldatei auswählen"
            onChange={(ereignis) => {
              const dateien = ereignis.target.files;
              if (dateien) void hochladen(dateien);
              ereignis.target.value = "";
            }}
          />
        </div>
      )}
    </div>
  );
}
