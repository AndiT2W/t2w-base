import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useT2W } from "@/lib/t2w/store";
import { SidebarMobileTrigger } from "@/components/t2w/AppSidebar";

/**
 * Die Kopfzeile über allen Modulen.  Vorher baute jede Seite ihren eigenen
 * Kopf und trug ihr eigenes Suchfeld; die „globale“ Suche war eine Umleitung
 * auf die Eventliste.  Hier liegt sie einmal, über allem.
 *
 * Die Suche zielt heute weiterhin auf die Eventliste — die Suche über
 * Events, Personen und Hardware entsteht erst mit dem Suchendpunkt.  Bis
 * dahin ist das Feld ehrlich beschriftet.
 *
 * Veranstalterkonten sehen keine Suche: ihr Zugriff endet bei den eigenen
 * Eventaufgaben, und ein Suchfeld, das nur eine Handvoll Zeilen kennt,
 * verspricht mehr als es hält.
 */
export function AppTopbar() {
  const navigate = useNavigate();
  const { locale, setLocale, t } = useI18n();
  const { currentUser } = useT2W();
  const [frage, setFrage] = useState("");
  const darfSuchen = currentUser.role !== "ORGANIZER";

  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6 lg:px-7">
      <SidebarMobileTrigger />

      {darfSuchen ? (
        <form
          className="relative w-full max-w-[26rem]"
          onSubmit={(event) => {
            event.preventDefault();
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
            onChange={(event) => setFrage(event.target.value)}
            aria-label={t("Global suchen …")}
            placeholder="Event, Veranstalter oder Ort suchen …"
            className="h-9 pl-8"
          />
        </form>
      ) : (
        <span className="text-sm font-semibold tracking-tight text-foreground lg:hidden">
          TIME2WIN
        </span>
      )}

      <div
        className="ml-auto flex rounded-md border border-border p-0.5"
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
                ? "bg-accent font-semibold text-accent-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.toUpperCase()}
          </button>
        ))}
      </div>
    </header>
  );
}
