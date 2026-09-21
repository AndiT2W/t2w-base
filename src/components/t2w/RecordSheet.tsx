import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

/**
 * Ein Datensatz öffnet im Sheet von rechts — auf jeder Liste dieselbe Form.
 *
 * Vorher hatte jedes Modul sein eigenes Muster: Kontakte ein Panel neben der
 * Tabelle, Auszahlungen ein Formular über der Tabelle, Hardware ein Sheet.
 * Drei Wege für dieselbe Handlung.  Jetzt gilt: eine Zeile anklicken öffnet
 * den Datensatz, sofort bearbeitbar; Anlegen öffnet dasselbe Sheet, nur leer.
 *
 * Der modale Dialog bleibt Rückfragen mit genau einer Entscheidung
 * vorbehalten („Auszahlung stornieren?“).
 */
export function RecordSheet({
  open,
  onOpenChange,
  titel,
  beschreibung,
  marke,
  dirty,
  speichern,
  speicherLabel = "Änderungen speichern",
  nebenaktion,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titel: string;
  /** Eine Zeile Herkunft: Art des Datensatzes, letzte Änderung. */
  beschreibung?: string;
  /** Symbol, Statuspunkt oder Initialen links im Kopf. */
  marke?: ReactNode;
  dirty?: boolean;
  speichern?: () => void;
  speicherLabel?: string;
  /** Die gefährliche Aktion. Sitzt links unten, weit weg vom Speichern. */
  nebenaktion?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <header className="flex shrink-0 items-start gap-3 border-b border-border px-5 pb-3.5 pt-4">
          {marke}
          <div className="min-w-0 flex-1">
            <SheetTitle className="truncate text-[17px] font-bold tracking-tight">
              {titel}
            </SheetTitle>
            {beschreibung ? (
              <SheetDescription className="mt-0.5 text-[12.5px]">{beschreibung}</SheetDescription>
            ) : (
              <SheetDescription className="sr-only">Datensatz bearbeiten</SheetDescription>
            )}
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto px-5 py-4">
          {children}
        </div>

        <footer className="flex shrink-0 items-center gap-2.5 border-t border-border bg-background px-5 py-3">
          {dirty && (
            <span className="text-xs text-task-waiting-strong" aria-live="polite">
              Ungespeicherte Änderungen
            </span>
          )}
          {nebenaktion}
          <div className="ml-auto flex gap-2">
            {/*
             * Ohne Speicherknopf gibt es nichts zu verwerfen: Felder, die beim
             * Verlassen sichern, kennen kein Abbrechen.  Dann heißt der Knopf,
             * was er tut.
             */}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {speichern ? "Abbrechen" : "Schließen"}
            </Button>
            {speichern && (
              <Button onClick={speichern} disabled={dirty === false}>
                {speicherLabel}
              </Button>
            )}
          </div>
        </footer>
      </SheetContent>
    </Sheet>
  );
}

/** Feldgruppe im Sheet: Überschrift plus Raster. */
export function SheetGruppe({
  titel,
  spalten = 2,
  children,
}: {
  titel: string;
  spalten?: 1 | 2;
  children: ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.05em] text-muted-foreground">
        {titel}
      </h3>
      <div className={spalten === 1 ? "grid gap-2.5" : "grid gap-2.5 sm:grid-cols-2"}>
        {children}
      </div>
    </div>
  );
}
