import { useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useT2W } from "@/lib/t2w/store";
import { SidebarMobileTrigger } from "@/components/t2w/AppSidebar";
import { GlobalSearch } from "@/components/t2w/GlobalSearch";
import { useSchmal, useSeitenkopf } from "@/components/t2w/Seitenkopf";

/**
 * Die Kopfzeile über allen Modulen.  Vorher baute jede Seite ihren eigenen
 * Kopf und trug ihr eigenes Suchfeld; die „globale“ Suche war eine Umleitung
 * auf die Eventliste.  Hier liegt sie einmal, über allem.
 *
 * Die Suche findet über Events, Personen und Hardware; die Trefferliste
 * steht in `GlobalSearch`.
 *
 * Veranstalterkonten sehen keine Suche: ihr Zugriff endet bei den eigenen
 * Eventaufgaben, und ein Suchfeld, das nur eine Handvoll Zeilen kennt,
 * verspricht mehr als es hält.
 */
export function AppTopbar() {
  const { locale, setLocale, t } = useI18n();
  const { currentUser } = useT2W();
  const { kopf } = useSeitenkopf();
  const schmal = useSchmal();
  const [sucheOffen, setSucheOffen] = useState(false);
  const darfSuchen = currentUser.role !== "ORGANIZER";

  /*
   * Auf dem Telefon traegt die Leiste den Seitentitel und eine Lupe; das
   * Suchfeld klappt erst auf Druck auf.  So zeichnet es das Artboard, und so
   * bleibt die erste Zeile der Liste ohne Scrollen sichtbar -- vorher
   * standen Suchfeld, Brotkrume, Ueberschrift und Beschreibung uebereinander.
   * Ab `md` bleibt alles wie gehabt: helle Leiste, offenes Suchfeld.
   */
  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center gap-3 border-b border-nav-active bg-nav px-4 text-nav-foreground md:border-border md:bg-background/95 md:px-6 md:text-foreground md:backdrop-blur lg:px-7">
      <SidebarMobileTrigger />

      {schmal && (
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {darfSuchen && sucheOffen ? (
            <GlobalSearch />
          ) : (
            <span className="min-w-0 flex-1">
              {/* Die Ueberschrift der Seite steht auf dem Telefon hier; im
                  Seitenkopf darunter faellt sie dafuer weg. */}
              <h1 className="truncate text-sm font-bold">{kopf.titel || "TIME2WIN"}</h1>
              {kopf.unterzeile && (
                <span className="block truncate text-[11.5px] text-nav-muted">
                  {kopf.unterzeile}
                </span>
              )}
            </span>
          )}
          {darfSuchen && (
            <button
              type="button"
              aria-label={sucheOffen ? "Suche schließen" : "Suchen"}
              aria-expanded={sucheOffen}
              onClick={() => setSucheOffen((offen) => !offen)}
              className="grid size-9 shrink-0 place-items-center rounded-lg border border-nav-active text-nav-foreground"
            >
              {sucheOffen ? (
                <X className="size-4" aria-hidden="true" />
              ) : (
                <Search className="size-4" aria-hidden="true" />
              )}
            </button>
          )}
        </div>
      )}

      {!schmal && (
        <div className="min-w-0 flex-1 md:flex">
          {darfSuchen ? (
            <GlobalSearch />
          ) : (
            <span className="text-sm font-semibold tracking-tight text-foreground">TIME2WIN</span>
          )}
        </div>
      )}

      <div
        className="ml-auto flex rounded-md border border-nav-active p-0.5 md:border-border"
        role="group"
        aria-label={t("language")}
      >
        {(["de", "en"] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={locale === option}
            aria-label={option === "de" ? t("language.de") : t("language.en")}
            onClick={() => setLocale(option)}
            className={cn(
              "rounded px-2 py-1 text-xs transition-colors",
              locale === option
                ? "bg-nav-active font-semibold text-nav-foreground md:bg-accent md:text-accent-foreground"
                : "text-nav-muted hover:text-nav-foreground md:text-muted-foreground md:hover:text-foreground",
            )}
          >
            {option.toUpperCase()}
          </button>
        ))}
      </div>
    </header>
  );
}
