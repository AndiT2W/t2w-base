import { createContext, useContext, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  CalendarDays,
  CalendarRange,
  CheckSquare,
  FileText,
  LayoutDashboard,
  Menu,
  Palette,
  Receipt,
  Ruler,
  Settings2,
  Users,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export const HAUPT_NAV = [
  { to: "/", label: "Übersicht", icon: LayoutDashboard, exact: true },
  { to: "/veranstaltungen", label: "Veranstaltungen", icon: CalendarDays, exact: false },
  { to: "/aufgaben", label: "Aufgaben", icon: CheckSquare, exact: false },
  { to: "/kontakte", label: "Kontakte", icon: Users, exact: false },
  { to: "/angebote", label: "Angebote", icon: FileText, exact: false },
  { to: "/rechnungen", label: "Rechnungen", icon: Receipt, exact: false },
  { to: "/einstellungen", label: "Einstellungen", icon: Settings2, exact: false },
] as const;

export const NEBEN_NAV = [
  { to: "/kalender", label: "Kalender", icon: CalendarRange },
  { to: "/varianten", label: "Design-Varianten", icon: Palette },
  { to: "/styleguide", label: "Styleguide", icon: Ruler },
] as const;

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
  return (
    <div className="flex h-full flex-col gap-6 bg-nav px-3 py-4 text-nav-foreground">
      <Link to="/" onClick={onNavigate} className="flex items-center gap-2.5 px-2">
        <span className="grid size-8 place-items-center rounded-md bg-nav-active text-sm font-bold tracking-tight">
          T2
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold tracking-tight">TIME2WIN</span>
          <span className="block truncate text-xs text-nav-muted">Eventverwaltung</span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-nav-muted">
          Module
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
            {item.label}
          </Link>
        ))}

        <p className="px-3 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-wide text-nav-muted">
          Weitere
        </p>
        {NEBEN_NAV.map((item) => (
          <Link key={item.to} to={item.to} onClick={onNavigate} className={linkClass}>
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>

      <p className="px-3 text-[11px] leading-relaxed text-nav-muted">
        Demo-Zustand · keine echten Integrationen
      </p>
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
