import { createContext, useContext, useState, type ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  CalendarDays,
  CheckSquare,
  FileText,
  LayoutDashboard,
  Menu,
  Receipt,
  Ruler,
  Settings2,
  Users,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export const HAUPT_NAV = [
  { to: "/", label: "Übersicht", icon: LayoutDashboard, exact: true },
  { to: "/veranstaltungen", label: "Veranstaltungen", icon: CalendarDays, exact: false },
  { to: "/aufgaben", label: "Aufgaben", icon: CheckSquare, exact: false },
  { to: "/kontakte", label: "Kunden & Kontakte", icon: Users, exact: false },
  { to: "/angebote", label: "Angebote", icon: FileText, exact: false },
  { to: "/rechnungen", label: "Rechnungen", icon: Receipt, exact: false },
  { to: "/einstellungen", label: "Einstellungen", icon: Settings2, exact: false },
] as const;

export const NEBEN_NAV = [{ to: "/styleguide", label: "Styleguide", icon: Ruler }] as const;

const HAUPT_NAV_KEYS = {
  "/": "nav.overview",
  "/veranstaltungen": "nav.events",
  "/aufgaben": "nav.tasks",
  "/kontakte": "nav.contacts",
  "/angebote": "nav.offers",
  "/rechnungen": "nav.invoices",
  "/einstellungen": "nav.settings",
} as const;

const NEBEN_NAV_KEYS = {
  "/styleguide": "nav.styleguide",
} as const;

const ENGLISH_NAV = {
  "nav.overview": "Overview",
  "nav.events": "Events",
  "nav.tasks": "Tasks",
  "nav.contacts": "Contacts",
  "nav.offers": "Offers",
  "nav.invoices": "Invoices",
  "nav.settings": "Settings",
  "nav.calendar": "Calendar",
  "nav.variants": "Design variants",
  "nav.styleguide": "Style guide",
} as const;

const SidebarUiContext = createContext<{
  offen: boolean;
  setOffen: (v: boolean) => void;
} | null>(null);

export function SidebarShellProvider({ children }: { children: ReactNode }) {
  const [offen, setOffen] = useState(false);
  return (
    <SidebarUiContext.Provider value={{ offen, setOffen }}>{children}</SidebarUiContext.Provider>
  );
}

function useSidebarUi() {
  const ctx = useContext(SidebarUiContext);
  if (!ctx) throw new Error("SidebarShellProvider fehlt");
  return ctx;
}

const linkClass =
  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-nav-muted transition-colors hover:bg-nav-active/60 hover:text-nav-foreground data-[status=active]:bg-nav-active data-[status=active]:text-nav-foreground";

function NavInhalt({ onNavigate }: { onNavigate?: () => void }) {
  const { locale, setLocale, t } = useI18n();
  const { pathname } = useLocation();
  return (
    <div className="flex h-full flex-col gap-6 bg-nav px-3 py-4 text-nav-foreground">
      <Link to="/" onClick={onNavigate} className="flex items-center gap-2.5 px-2">
        <img src="/time2win_logo_button.svg" alt="TIME2WIN Logo" className="size-8 rounded-md" />
        <span className="min-w-0">
          <span className="block text-sm font-semibold tracking-tight">TIME2WIN</span>
          <span className="block truncate text-xs text-nav-muted">Eventverwaltung</span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-nav-muted">
          {locale === "en" ? "Modules" : "Module"}
        </p>
        {HAUPT_NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            activeOptions={{ exact: item.exact }}
            className={linkClass}
          >
            <item.icon className="size-4 shrink-0" />
            {locale === "en" ? ENGLISH_NAV[HAUPT_NAV_KEYS[item.to]] : item.label}
          </Link>
        ))}

        <p className="px-3 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-wide text-nav-muted">
          {locale === "en" ? "More" : "Weitere"}
        </p>
        {NEBEN_NAV.map((item) => (
          <Link key={item.to} to={item.to} onClick={onNavigate} className={linkClass}>
            <item.icon className="size-4 shrink-0" />
            {locale === "en" ? ENGLISH_NAV[NEBEN_NAV_KEYS[item.to]] : item.label}
          </Link>
        ))}
      </nav>

      <div className="space-y-3 px-3">
        <div className="flex items-center justify-between gap-2 text-xs text-nav-muted">
          <div
            className="flex rounded border border-nav-active p-0.5"
            role="group"
            aria-label={t("language")}
          >
            {(["de", "en"] as const).map((option) => (
              <a
                key={option}
                href={`/?locale=${option}`}
                onClick={() => setLocale(option)}
                aria-pressed={locale === option}
                aria-label={option === "de" ? t("language.de") : t("language.en")}
                className={cn(
                  "rounded px-2 py-1 text-xs",
                  locale === option
                    ? "bg-nav-active text-nav-foreground"
                    : "text-nav-muted hover:text-nav-foreground",
                )}
              >
                {option.toUpperCase()}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppSidebar() {
  const { offen, setOffen } = useSidebarUi();
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-nav-active lg:block">
        <NavInhalt />
      </aside>
      <Sheet open={offen} onOpenChange={setOffen}>
        <SheetContent side="left" className="w-64 border-r-0 bg-nav p-0 lg:hidden">
          <SheetTitle className="sr-only">Hauptnavigation</SheetTitle>
          <NavInhalt onNavigate={() => setOffen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}

export function SidebarMobileTrigger({ className }: { className?: string }) {
  const { setOffen } = useSidebarUi();
  return (
    <button
      type="button"
      onClick={() => setOffen(true)}
      aria-label="Navigation öffnen"
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-md border border-border text-foreground transition-colors hover:bg-accent lg:hidden",
        className,
      )}
    >
      <Menu className="size-4" />
    </button>
  );
}
