import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";

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
  beschreibung?: string;
  suche?: { value: string; onChange: (v: string) => void; placeholder?: string };
  aktion?: ReactNode;
}) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [global, setGlobal] = useState("");

  return (
    <header className="sticky top-0 z-30 -mx-4 mb-5 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
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
          <h1 className="mt-1 truncate text-xl font-semibold tracking-tight text-foreground">
            {t(titel)}
          </h1>
          {beschreibung && (
            <p className="mt-0.5 text-sm text-muted-foreground">{t(beschreibung)}</p>
          )}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <form
            className="relative w-64"
            onSubmit={(e) => {
              e.preventDefault();
              if (!suche) navigate({ to: "/veranstaltungen", search: { q: global } });
            }}
          >
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={suche ? suche.value : global}
              onChange={(e) => (suche ? suche.onChange(e.target.value) : setGlobal(e.target.value))}
              placeholder={t(suche?.placeholder ?? "Global suchen …")}
              aria-label="Suche"
              className="h-9 pl-8"
            />
          </form>
          {aktion}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 md:hidden">
        <form
          className="relative flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            if (!suche) navigate({ to: "/veranstaltungen", search: { q: global } });
          }}
        >
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={suche ? suche.value : global}
            onChange={(e) => (suche ? suche.onChange(e.target.value) : setGlobal(e.target.value))}
            placeholder={t(suche?.placeholder ?? "Global suchen …")}
            aria-label="Suche"
            className="h-9 pl-8"
          />
        </form>
        {aktion}
      </div>
    </header>
  );
}
