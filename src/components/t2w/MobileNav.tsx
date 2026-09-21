import { Link } from "@tanstack/react-router";
import { HAUPT_NAV } from "@/components/t2w/AppSidebar";
import { useT2W } from "@/lib/t2w/store";
import { useI18n } from "@/lib/i18n";

/**
 * Die fünf Hauptmodule als Leiste am unteren Rand — nur auf dem Telefon.
 *
 * Die Schublade hinter dem Menüknopf bleibt und führt überallhin; sie kostet
 * aber zwei Griffe für den Wechsel zwischen zwei Modulen, den man unterwegs am
 * häufigsten macht. Die Leiste macht daraus einen.
 *
 * Sie zeigt nur, was das Konto darf: dieselbe Regel wie in der Seitenleiste,
 * Gesperrtes wird weggelassen statt ausgegraut. Bleibt weniger als zwei übrig
 * — ein Veranstalterkonto sieht nur die Aufgaben —, verschwindet die Leiste
 * ganz; eine Leiste mit einem Knopf ist keine.
 *
 * Das aktive Feld trägt Kante, Halbfett und Farbe zugleich: Farbe allein
 * trüge die Aussage nicht.
 */
const MOBIL_NAV = [
  ["/", "nav.overview"],
  ["/veranstaltungen", "nav.shortEvents"],
  ["/aufgaben", "nav.tasks"],
  ["/kontakte", "nav.contacts"],
  ["/hardware", "Hardware"],
] as const;

export function MobileNav() {
  const { currentUser } = useT2W();
  const { t } = useI18n();
  const eintraege = MOBIL_NAV.flatMap(([ziel, schluessel]) => {
    const eintrag = HAUPT_NAV.find((item) => item.to === ziel);
    if (!eintrag?.available) return [];
    if (currentUser.role === "ORGANIZER" && ziel !== "/aufgaben") return [];
    return [{ ...eintrag, schluessel }];
  });
  if (eintraege.length < 2) return null;

  return (
    <nav
      aria-label="Hauptbereiche"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-background/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {eintraege.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          activeOptions={{ exact: item.exact }}
          className="flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 border-t-2 border-transparent px-1 py-1.5 text-[10.5px] font-medium text-muted-foreground transition-colors data-[status=active]:border-primary data-[status=active]:font-bold data-[status=active]:text-foreground"
        >
          <item.icon className="size-5 shrink-0" aria-hidden="true" />
          <span className="truncate">{t(item.schluessel)}</span>
        </Link>
      ))}
    </nav>
  );
}
