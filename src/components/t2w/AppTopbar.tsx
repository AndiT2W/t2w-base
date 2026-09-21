import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useT2W } from "@/lib/t2w/store";
import { SidebarMobileTrigger } from "@/components/t2w/AppSidebar";
import { GlobalSearch } from "@/components/t2w/GlobalSearch";

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
  const darfSuchen = currentUser.role !== "ORGANIZER";

  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6 lg:px-7">
      <SidebarMobileTrigger />

      {darfSuchen ? (
        <GlobalSearch />
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
