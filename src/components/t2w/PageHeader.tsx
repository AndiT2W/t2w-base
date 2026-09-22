import { useEffect, useRef, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { useSchmal, useSeitenkopf } from "@/components/t2w/Seitenkopf";

export type Krume = { label: string; to?: "/" | "/veranstaltungen" };

export function PageHeader({
  krumen = [],
  titel,
  beschreibung,
  suche,
  aktion,
}: {
  krumen?: Krume[];
  titel: string;
  beschreibung?: ReactNode;
  suche?: { value: string; onChange: (v: string) => void; placeholder?: string };
  aktion?: ReactNode;
}) {
  const { t } = useI18n();
  const headerRef = useRef<HTMLElement>(null);
  /*
   * Auf dem Telefon traegt die dunkle Leiste oben den Seitentitel; hier
   * bleiben nur die Aktionen stehen.  Gemeldet wird der uebersetzte Titel
   * und, wenn die Beschreibung ein einfacher Text ist, auch die.
   */
  const { melde } = useSeitenkopf();
  const schmal = useSchmal();
  const unterzeile = typeof beschreibung === "string" ? t(beschreibung) : "";
  useEffect(() => {
    melde({ titel: t(titel), unterzeile });
  }, [melde, t, titel, unterzeile]);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const updateOffset = () => {
      const bottom = Math.ceil(header.getBoundingClientRect().bottom);
      document.documentElement.style.setProperty("--t2w-page-header-bottom", `${bottom}px`);
    };
    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateOffset) : null;

    resizeObserver?.observe(header);
    window.addEventListener("resize", updateOffset);
    updateOffset();
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateOffset);
      document.documentElement.style.removeProperty("--t2w-page-header-bottom");
    };
  }, []);

  /*
   * Der Seitenkopf klebt unter der Kopfzeile, nicht an der Fensterkante:
   * seit die globale Suche oben liegt, teilen sich sonst beide denselben
   * Platz. Der Tabellenkopf hängt über `--t2w-page-header-bottom` daran.
   */
  return (
    <header
      ref={headerRef}
      className="sticky top-14 z-30 -mx-4 mb-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-7 lg:px-7"
    >
      {/* Suche und Aktion stehen genau einmal im Baum: sie lagen frueher
          zweimal da, einmal fuer schmale und einmal fuer breite Fenster. Die
          verborgene Haelfte nahm dabei Verweise entgegen, die ins Leere
          liefen -- etwa den Fokus nach dem Schliessen eines Dialogs. Der
          Umbruch erledigt jetzt, was zwei Kopien erledigen sollten. */}
      <div className="flex flex-wrap items-start gap-3">
        {/* Auf dem Telefon traegt die Kopfzeile oben Titel und Brotkrume; hier
            bleibt die Zeile darunter stehen.  Sie fuehrt oft Verweise --
            etwa den Veranstalter eines Events -- und ist damit mehr als
            Beiwerk. */}
        <div className="min-w-0 flex-1 basis-full md:basis-auto">
          {!schmal && (
            <>
              <nav
                aria-label="Breadcrumb"
                className="flex items-center gap-1 text-xs text-muted-foreground"
              >
                {krumen.map((k) => (
                  <span key={k.label} className="flex items-center gap-1">
                    {k.to ? (
                      <Link to={k.to} className="transition-colors hover:text-foreground">
                        {t(k.label)}
                      </Link>
                    ) : (
                      <span>{t(k.label)}</span>
                    )}
                    <ChevronRight className="size-3" />
                  </span>
                ))}
                <span className="font-medium text-foreground">{t(titel)}</span>
              </nav>
              <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight text-foreground">
                {t(titel)}
              </h1>
            </>
          )}
          {beschreibung && (
            <p
              className={
                schmal
                  ? "text-[13px] text-muted-foreground"
                  : "mt-0.5 text-[13px] text-muted-foreground"
              }
            >
              {typeof beschreibung === "string" ? t(beschreibung) : beschreibung}
            </p>
          )}
        </div>

        {(suche || aktion) && (
          <div className="flex w-full items-center gap-2 md:w-auto">
            {suche && (
              <label className="relative flex-1 md:w-64 md:flex-none">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={suche.value}
                  onChange={(e) => suche.onChange(e.target.value)}
                  aria-label="Suche"
                  placeholder={t(suche.placeholder ?? "Liste durchsuchen …")}
                  className="h-11 pl-8 sm:h-9"
                />
              </label>
            )}
            {aktion}
          </div>
        )}
      </div>
    </header>
  );
}
