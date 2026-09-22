import { Fragment, createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  CalendarDays,
  CheckSquare,
  Clock3,
  FileText,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  Ruler,
  Settings2,
  Users,
  Package,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useT2W } from "@/lib/t2w/store";
import { AccountDialog } from "@/components/t2w/AccountDialog";

/**
 * Drei Gruppen statt einer Liste: Arbeitsflächen, Geld, System.  Eine Liste
 * aus neun Einträgen zwingt zum Lesen von oben; drei kurze Gruppen lassen
 * einen an der Überschrift abbiegen.  Eine Gruppe, die für ein Konto leer
 * bleibt, verschwindet samt Überschrift — wer keinen Finanzzugriff hat,
 * sieht nicht, dass es dort etwas gäbe.
 */
/** Höchstens zwei Buchstaben; bei einem einzelnen Namen genügt der erste. */
function initialen(name: string) {
  const teile = name.trim().split(/\s+/).filter(Boolean);
  if (teile.length === 0) return "?";
  return (teile[0]![0]! + (teile.length > 1 ? teile.at(-1)![0]! : "")).toUpperCase();
}

const ROLLEN: Record<string, string> = {
  ADMIN: "Admin",
  USER: "Benutzer",
  ORGANIZER: "Veranstalter",
};
const rollenname = (rolle: string) => ROLLEN[rolle] ?? rolle;

export const HAUPT_NAV = [
  {
    to: "/",
    label: "Übersicht",
    icon: LayoutDashboard,
    exact: true,
    available: true,
    gruppe: "module",
  },
  {
    to: "/veranstaltungen",
    label: "Veranstaltungen",
    icon: CalendarDays,
    exact: false,
    available: true,
    gruppe: "module",
  },
  {
    to: "/aufgaben",
    label: "Aufgaben",
    icon: CheckSquare,
    exact: false,
    available: true,
    gruppe: "module",
  },
  {
    to: "/kontakte",
    label: "Kunden & Kontakte",
    icon: Users,
    exact: false,
    available: true,
    gruppe: "module",
  },
  {
    to: "/hardware",
    label: "Hardware",
    icon: Package,
    exact: false,
    available: true,
    gruppe: "module",
  },
  {
    to: "/auszahlungen",
    label: "Auszahlungen",
    icon: Receipt,
    exact: false,
    available: true,
    gruppe: "finanzen",
  },
  {
    to: "/angebote",
    label: "Angebote",
    icon: FileText,
    exact: false,
    available: false,
    gruppe: "finanzen",
  },
  {
    to: "/rechnungen",
    label: "Rechnungen",
    icon: Receipt,
    exact: false,
    available: false,
    gruppe: "finanzen",
  },
  {
    to: "/einstellungen",
    label: "Einstellungen",
    icon: Settings2,
    exact: false,
    available: true,
    gruppe: "system",
  },
  {
    to: "/styleguide",
    label: "Bausteine",
    icon: Ruler,
    exact: false,
    available: true,
    gruppe: "system",
  },
] as const;

/** Die Gruppen in ihrer Reihenfolge, mit dem Schlüssel ihrer Überschrift. */
const GRUPPEN = [
  ["module", "nav.modules"],
  ["finanzen", "nav.finance"],
  ["system", "nav.system"],
] as const;

const HAUPT_NAV_KEYS = {
  "/": "nav.overview",
  "/veranstaltungen": "nav.events",
  "/aufgaben": "nav.tasks",
  "/kontakte": "nav.contactsCustomers",
  "/hardware": "Hardware",
  "/auszahlungen": "nav.payouts",
  "/angebote": "nav.offers",
  "/rechnungen": "nav.invoices",
  "/einstellungen": "nav.settings",
  "/styleguide": "nav.styleguide",
} as const;

/**
 * Die Breite der Leiste, aus dem freigegebenen Artboard: 248 px in der
 * Grundstellung, 68 px als schmale Symbolleiste (siehe DESIGN.md).
 *
 * Die Werte stehen hier an einer Stelle, weil die Inhaltsfläche in
 * `__root.tsx` denselben Betrag als linken Abstand braucht.  Liefen die
 * beiden auseinander, läge die Leiste über dem Inhalt oder es bliebe ein
 * Streifen Hintergrund daneben — genau das ist beim vorherigen Paar aus
 * `w-60`/`lg:pl-60` nur deshalb nicht passiert, weil beide zufällig
 * dieselbe Zahl trugen.
 *
 * 68 px ist kein runder Zufallswert: Rahmen, zweimal Rand und die 44 px
 * Fingerkuppe dazwischen.  Bei den bisherigen 64 px fehlten vier davon und
 * die Symbolfelder ragten in den Rand der Leiste.
 */
export const SIDEBAR_BREITE = { voll: "w-[248px]", schmal: "w-[68px]" } as const;
export const SIDEBAR_ABSTAND = { voll: "lg:pl-[248px]", schmal: "lg:pl-[68px]" } as const;

const SidebarUiContext = createContext<{
  offen: boolean;
  setOffen: (v: boolean) => void;
  schmal: boolean;
  setSchmal: (v: boolean) => void;
} | null>(null);

/**
 * Der eingeklappte Zustand ist eine Vorliebe am Gerät, nicht am Konto: am
 * großen Schirm aufgeklappt, am Laptop neben einer breiten Tabelle
 * eingeklappt.  Darum localStorage und nicht die Benutzerpräferenzen auf dem
 * Server — über Geräte hinweg synchronisiert wäre es eher lästig.
 */
const SCHMAL_KEY = "t2w-nav-schmal";

export function SidebarShellProvider({ children }: { children: ReactNode }) {
  const [offen, setOffen] = useState(false);
  const [schmal, setSchmalState] = useState(false);

  useEffect(() => {
    try {
      setSchmalState(window.localStorage.getItem(SCHMAL_KEY) === "1");
    } catch {
      // Privater Modus oder gesperrter Speicher: aufgeklappt bleiben.
    }
  }, []);

  const setSchmal = (wert: boolean) => {
    setSchmalState(wert);
    try {
      window.localStorage.setItem(SCHMAL_KEY, wert ? "1" : "0");
    } catch {
      // Nicht merkbar, aber für diese Sitzung gültig.
    }
  };

  return (
    <SidebarUiContext.Provider value={{ offen, setOffen, schmal, setSchmal }}>
      {children}
    </SidebarUiContext.Provider>
  );
}

function useSidebarUi() {
  const ctx = useContext(SidebarUiContext);
  if (!ctx) throw new Error("SidebarShellProvider fehlt");
  return ctx;
}

/** Für das Seitengerüst: wie breit die Navigation gerade ist. */
export function useSidebarSchmal() {
  return useSidebarUi().schmal;
}

const linkClass =
  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-nav-muted transition-colors hover:bg-nav-active/60 hover:text-nav-foreground data-[status=active]:bg-nav-active data-[status=active]:text-nav-foreground";

function NavInhalt({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useI18n();
  const { currentUser, logout } = useT2W();
  const { pathname } = useLocation();
  const [accountOpen, setAccountOpen] = useState(false);
  const einstellungenAktiv = pathname.startsWith("/einstellungen");
  const visibleMain = HAUPT_NAV.filter((item) => {
    if (currentUser.role === "ORGANIZER") return item.to === "/aufgaben";
    if (
      ["/auszahlungen", "/angebote", "/rechnungen"].includes(item.to) &&
      !currentUser.financeAccess
    )
      return false;
    if (item.to === "/einstellungen" && currentUser.role !== "ADMIN") return false;
    return true;
  });
  return (
    <div className="flex h-full flex-col gap-6 bg-nav px-3 py-4 text-nav-foreground">
      <Link
        to={currentUser.role === "ORGANIZER" ? "/aufgaben" : "/"}
        onClick={onNavigate}
        className="flex items-center gap-2.5 px-2"
      >
        <img src="/time2win_logo_button.svg" alt="TIME2WIN Logo" className="size-8 rounded-md" />
        <span className="min-w-0">
          <span className="block text-sm font-semibold tracking-tight">TIME2WIN</span>
          <span className="block truncate text-xs text-nav-muted">Eventverwaltung</span>
        </span>
      </Link>

      {/* Scrollt statt zu ueberlaufen: mit drei Gruppen und dem offenen
          Einstellungsmenue ist die Leiste hoeher als ein kurzer Bildschirm,
          und der Benutzerblock am Fuss war nicht mehr zu sehen. */}
      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
        {GRUPPEN.map(([gruppe, schluessel]) => {
          const eintraege = visibleMain.filter((item) => item.gruppe === gruppe);
          if (eintraege.length === 0) return null;
          return (
            <div key={gruppe} className="flex flex-col gap-1 pb-4 last:pb-0">
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-nav-muted">
                {t(schluessel)}
              </p>
              {eintraege.map((item) =>
                item.available ? (
                  <Fragment key={item.to}>
                    <Link
                      to={item.to}
                      onClick={onNavigate}
                      activeOptions={{ exact: item.exact }}
                      className={linkClass}
                    >
                      <item.icon className="size-4 shrink-0" />
                      {t(HAUPT_NAV_KEYS[item.to])}
                      {item.to === "/einstellungen" && (
                        <ChevronDown
                          className={cn(
                            "ml-auto size-4 transition-transform",
                            einstellungenAktiv && "rotate-180",
                          )}
                          aria-hidden="true"
                        />
                      )}
                    </Link>
                    {item.to === "/einstellungen" && einstellungenAktiv && (
                      <div
                        className="ml-3 border-l border-nav-active pl-2"
                        aria-label="Einstellungen Untermenü"
                      >
                        {[
                          ["allgemein", "Allgemein"],
                          ["benutzer", "Benutzer"],
                          ["auswahllisten", "Auswahllisten"],
                          ["outlook", "Outlook"],
                          ["auditlog", "Auditlog"],
                        ].map(([value, label]) => (
                          <Link
                            key={value}
                            to="/einstellungen"
                            search={{
                              tab: value as
                                "allgemein" | "benutzer" | "auswahllisten" | "outlook" | "auditlog",
                              liste: "services",
                            }}
                            onClick={onNavigate}
                            className={cn(
                              linkClass,
                              "py-1.5 text-xs",
                              "data-[status=active]:bg-nav-active data-[status=active]:text-nav-foreground",
                            )}
                          >
                            {label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </Fragment>
                ) : (
                  <span
                    key={item.to}
                    aria-disabled="true"
                    aria-label={`${t(HAUPT_NAV_KEYS[item.to])}: ${t("nav.inPreparation")}`}
                    title={t("nav.inPreparation")}
                    className="flex cursor-not-allowed items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-nav-muted/60"
                  >
                    <item.icon className="size-4 shrink-0" />
                    {t(HAUPT_NAV_KEYS[item.to])}
                    <Clock3 className="ml-auto size-3.5 shrink-0" aria-hidden="true" />
                    <span className="sr-only">{t("nav.inPreparation")}</span>
                  </span>
                ),
              )}
            </div>
          );
        })}
      </nav>

      <div className="space-y-3 px-3">
        <div className="border-t border-nav-active pt-3">
          {/* Die Rolle statt der Adresse: wer hier steht, kennt seine eigene
              E-Mail. Was er darf, sieht er sonst nirgends. */}
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="grid size-8 shrink-0 place-items-center rounded-full bg-nav-active text-xs font-bold"
            >
              {initialen(currentUser.displayName)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{currentUser.displayName}</span>
              <span className="block truncate text-xs text-nav-muted">
                {rollenname(currentUser.role)}
                {currentUser.financeAccess && " · Finanzzugriff"}
              </span>
            </span>
          </div>
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              className="text-xs text-nav-muted hover:text-nav-foreground"
              onClick={() => setAccountOpen(true)}
            >
              Profil
            </button>
            <button
              type="button"
              className="flex items-center gap-2 text-xs text-nav-muted hover:text-nav-foreground"
              onClick={() => void logout()}
            >
              <LogOut className="size-3.5" /> Abmelden
            </button>
          </div>
        </div>
      </div>
      <AccountDialog user={currentUser} open={accountOpen} onOpenChange={setAccountOpen} />
    </div>
  );
}

/**
 * Die schmale Leiste.  Auf breiten Tabellen — Gantt, Kalender, Auszahlungen —
 * gibt die Navigation gut 180 px an den Inhalt ab und zeigt nur noch Symbole.
 * Der Name steht im Tooltip und im barrierefreien Namen, nie nur als Bild.
 */
function NavRail() {
  const { t } = useI18n();
  const { currentUser } = useT2W();
  const { setSchmal } = useSidebarUi();
  const sichtbar = HAUPT_NAV.filter((item) => {
    if (currentUser.role === "ORGANIZER") return item.to === "/aufgaben";
    if (
      ["/auszahlungen", "/angebote", "/rechnungen"].includes(item.to) &&
      !currentUser.financeAccess
    )
      return false;
    if (item.to === "/einstellungen" && currentUser.role !== "ADMIN") return false;
    return true;
  });
  return (
    <div className="flex h-full flex-col items-center gap-1 bg-nav px-3 py-4 text-nav-foreground">
      <Link
        to={currentUser.role === "ORGANIZER" ? "/aufgaben" : "/"}
        className="mb-3"
        aria-label="TIME2WIN"
      >
        <img src="/time2win_logo_button.svg" alt="TIME2WIN Logo" className="size-8 rounded-md" />
      </Link>
      <nav className="flex flex-1 flex-col gap-1">
        {sichtbar.map((item) =>
          item.available ? (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact }}
              title={t(HAUPT_NAV_KEYS[item.to])}
              aria-label={t(HAUPT_NAV_KEYS[item.to])}
              className="grid size-11 place-items-center rounded-md text-nav-muted transition-colors hover:bg-nav-active/60 hover:text-nav-foreground data-[status=active]:bg-nav-active data-[status=active]:text-nav-foreground"
            >
              <item.icon className="size-[18px]" />
            </Link>
          ) : (
            <span
              key={item.to}
              aria-disabled="true"
              title={`${t(HAUPT_NAV_KEYS[item.to])}: ${t("nav.inPreparation")}`}
              className="grid size-11 cursor-not-allowed place-items-center rounded-md text-nav-muted/60"
            >
              <item.icon className="size-[18px]" />
              <span className="sr-only">
                {t(HAUPT_NAV_KEYS[item.to])}: {t("nav.inPreparation")}
              </span>
            </span>
          ),
        )}
      </nav>
      <button
        type="button"
        onClick={() => setSchmal(false)}
        aria-label="Navigation ausklappen"
        title="Navigation ausklappen"
        className="grid size-11 place-items-center rounded-md text-nav-muted transition-colors hover:bg-nav-active/60 hover:text-nav-foreground"
      >
        <PanelLeftOpen className="size-[18px]" />
      </button>
    </div>
  );
}

export function AppSidebar() {
  const { offen, setOffen, schmal, setSchmal } = useSidebarUi();
  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-nav-active lg:block",
          schmal ? SIDEBAR_BREITE.schmal : SIDEBAR_BREITE.voll,
        )}
      >
        {schmal ? (
          <NavRail />
        ) : (
          <>
            <NavInhalt />
            <button
              type="button"
              onClick={() => setSchmal(true)}
              aria-label="Navigation einklappen"
              title="Navigation einklappen"
              className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-md text-nav-muted transition-colors hover:bg-nav-active/60 hover:text-nav-foreground"
            >
              <PanelLeftClose className="size-4" />
            </button>
          </>
        )}
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
        "grid size-11 shrink-0 place-items-center rounded-md border border-border text-foreground transition-colors hover:bg-accent lg:hidden",
        className,
      )}
    >
      <Menu className="size-4" />
    </button>
  );
}
