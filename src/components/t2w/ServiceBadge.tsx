import {
  Activity,
  Bike,
  Bell,
  Calendar,
  Camera,
  CircleCheck,
  ClipboardList,
  Cloud,
  Euro,
  Footprints,
  Headphones,
  Laptop,
  Mail,
  MapPin,
  MessageCircle,
  Mountain,
  Monitor,
  Music,
  Package,
  PanelsTopLeft,
  Phone,
  Radio,
  Printer,
  Settings,
  Smartphone,
  Star,
  StickyNote,
  Tag,
  Trophy,
  UserRound,
  Users,
  Video,
  Wifi,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { badgeVariants } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { istHochgeladen, symbolkennung, symbolQuelle } from "@/lib/t2w/icons";

type IconKey =
  | "radio"
  | "activity"
  | "camera"
  | "video"
  | "map-pin"
  | "panels-top-left"
  | "clipboard-list"
  | "smartphone"
  | "user-round"
  | "users"
  | "bell"
  | "calendar"
  | "circle-check"
  | "cloud"
  | "headphones"
  | "laptop"
  | "mail"
  | "message-circle"
  | "monitor"
  | "music"
  | "package"
  | "phone"
  | "printer"
  | "settings"
  | "star"
  | "sticky-note"
  | "tag"
  | "wifi"
  | "zap"
  | "euro"
  | "bike"
  | "footprints"
  | "mountain"
  | "trophy"
  | "waves";
/**
 * Acht Farben statt zwanzig.  Farbe bleibt ein Name, kein Hexwert: ein freier
 * Farbwähler ließe jemanden ein Hellgelb wählen, das auf Weiß niemand sieht,
 * und ein Palettenwechsel träfe eine Zuordnungstabelle statt gespeicherter
 * Werte in sieben Tabellen.  Migration 0038 bildet die alten zwanzig ab.
 */
type ColorKey = "tanne" | "blau" | "violett" | "amber" | "rot" | "graphit" | "petrol" | "beere";

type Presentation = { icon: IconKey; color: ColorKey };

const icons: Record<IconKey, LucideIcon> = {
  radio: Radio,
  activity: Activity,
  camera: Camera,
  video: Video,
  "map-pin": MapPin,
  "panels-top-left": PanelsTopLeft,
  "clipboard-list": ClipboardList,
  smartphone: Smartphone,
  "user-round": UserRound,
  users: Users,
  bell: Bell,
  calendar: Calendar,
  "circle-check": CircleCheck,
  cloud: Cloud,
  headphones: Headphones,
  laptop: Laptop,
  mail: Mail,
  "message-circle": MessageCircle,
  monitor: Monitor,
  music: Music,
  package: Package,
  phone: Phone,
  printer: Printer,
  settings: Settings,
  star: Star,
  "sticky-note": StickyNote,
  tag: Tag,
  wifi: Wifi,
  zap: Zap,
  euro: Euro,
  bike: Bike,
  footprints: Footprints,
  mountain: Mountain,
  trophy: Trophy,
  waves: Waves,
};
const colorClasses: Record<ColorKey, string> = {
  tanne: "border-emerald-300 bg-emerald-100 text-emerald-950",
  blau: "border-sky-300 bg-sky-100 text-sky-950",
  violett: "border-violet-300 bg-violet-100 text-violet-950",
  amber: "border-amber-300 bg-amber-100 text-amber-950",
  rot: "border-rose-300 bg-rose-100 text-rose-950",
  graphit: "border-slate-300 bg-slate-100 text-slate-950",
  petrol: "border-teal-300 bg-teal-100 text-teal-950",
  beere: "border-fuchsia-300 bg-fuchsia-100 text-fuchsia-950",
};
/** Kräftige Füllfarbe für `SelectionToggleChip`, wenn ausgewählt -- ein Formkörper statt Badge-in-Button. */
const fillClasses: Record<ColorKey, string> = {
  tanne: "bg-emerald-600",
  blau: "bg-sky-600",
  violett: "bg-violet-600",
  amber: "bg-amber-600",
  rot: "bg-rose-600",
  graphit: "bg-slate-600",
  petrol: "bg-teal-600",
  beere: "bg-fuchsia-600",
};
/** Textfarbe für freistehende Symbole (z.B. im Sportart-Feld) -- kein Badge, nur ein farbiges Icon. */
const accentTextClasses: Record<ColorKey, string> = {
  tanne: "text-emerald-600",
  blau: "text-sky-600",
  violett: "text-violet-600",
  amber: "text-amber-600",
  rot: "text-rose-600",
  graphit: "text-slate-600",
  petrol: "text-teal-600",
  beere: "text-fuchsia-600",
};
/** Symbole der Nachrichtenarten; die Sprechblase ist der Rückfall für unbekannte Arten. */
/**
 * Ein Symbolsatz für alle Auswahllisten.  Vorher gab es drei getrennte --
 * eine Sportart konnte kein Symbol wählen, das für Services vorgesehen war.
 * Die Trennung hatte keinen fachlichen Grund, nur einen historischen, und
 * sie machte die Pflegemaske je nach Liste unterschiedlich.
 */
export const ICON_OPTIONS: { value: IconKey; label: string }[] = [
  { value: "activity", label: "Aktivität" },
  { value: "clipboard-list", label: "Anmeldung" },
  { value: "smartphone", label: "App" },
  { value: "mountain", label: "Bergsport" },
  { value: "circle-check", label: "Bestätigung" },
  { value: "zap", label: "Blitz" },
  { value: "cloud", label: "Cloud" },
  { value: "printer", label: "Drucker" },
  { value: "mail", label: "E-Mail" },
  { value: "settings", label: "Einstellungen" },
  { value: "euro", label: "Euro" },
  { value: "star", label: "Favorit" },
  { value: "radio", label: "Funk" },
  { value: "users", label: "Gespräch" },
  { value: "bell", label: "Glocke" },
  { value: "headphones", label: "Headset" },
  { value: "calendar", label: "Kalender" },
  { value: "camera", label: "Kamera" },
  { value: "laptop", label: "Laptop" },
  { value: "footprints", label: "Laufen" },
  { value: "monitor", label: "Monitor" },
  { value: "music", label: "Musik" },
  { value: "message-circle", label: "Nachricht" },
  { value: "sticky-note", label: "Notiz" },
  { value: "package", label: "Paket" },
  { value: "user-round", label: "Person" },
  { value: "bike", label: "Radfahren" },
  { value: "waves", label: "Schwimmen" },
  { value: "map-pin", label: "Standort" },
  { value: "tag", label: "Tag" },
  { value: "phone", label: "Telefon" },
  { value: "video", label: "Video" },
  { value: "panels-top-left", label: "Virtuell" },
  { value: "trophy", label: "Wettkampf" },
  { value: "wifi", label: "WLAN" },
];

export const SERVICE_COLOR_OPTIONS: { value: ColorKey; label: string }[] = [
  { value: "tanne", label: "Tanne" },
  { value: "blau", label: "Blau" },
  { value: "violett", label: "Violett" },
  { value: "amber", label: "Amber" },
  { value: "rot", label: "Rot" },
  { value: "petrol", label: "Petrol" },
  { value: "beere", label: "Beere" },
  { value: "graphit", label: "Graphit" },
];
export function servicePresentation(service: {
  name: string;
  icon?: string | null | undefined;
  color?: string | null | undefined;
}) {
  /*
   * Kein Rueckgriff mehr auf den Namen: die Zuordnung nach Wertnamen stand
   * frueher hier und ging bei jeder Umbenennung verloren.  Seit Migration
   * 0038 stehen Symbol und Farbe in den Spalten; fehlt eines, gilt der
   * neutrale Vorgabewert.
   */
  const fallback = { icon: "panels-top-left" as IconKey, color: "graphit" as ColorKey };
  const color =
    service.color && service.color in colorClasses ? (service.color as ColorKey) : fallback.color;
  // Ein hochgeladenes Symbol hat keine Komponente, sondern eine Kennung; es
  // wird als Bild ausgeliefert. Der Rest der Darstellung -- Farbe, Rahmen,
  // Form -- bleibt derselbe, damit beide Herkunftsarten gleich aussehen.
  if (istHochgeladen(service.icon))
    return {
      Icon: icons[fallback.icon],
      className: colorClasses[color],
      icon: service.icon as string,
      color,
      hochgeladen: symbolkennung(service.icon as string),
    };
  const icon = service.icon && service.icon in icons ? (service.icon as IconKey) : fallback.icon;
  return { Icon: icons[icon], className: colorClasses[color], icon, color, hochgeladen: null };
}
export const selectionPresentation = servicePresentation;

/**
 * Freistehendes Symbol in Auswahllistenfarbe, ohne Badge-Rahmen -- für
 * Stellen wie den Sportart-Select, wo ein Badge im Trigger doppelten
 * Rahmen erzeugen würde.
 */
export function SelectionIcon({
  name,
  icon,
  color,
  className,
}: {
  name: string;
  icon?: string | null | undefined;
  color?: string | null | undefined;
  className?: string;
}) {
  const presentation = servicePresentation({
    name,
    ...(icon === undefined ? {} : { icon }),
    ...(color === undefined ? {} : { color }),
  });
  if (presentation.hochgeladen)
    return (
      <img
        src={symbolQuelle(presentation.hochgeladen)}
        alt=""
        aria-hidden="true"
        className={cn("size-4 shrink-0 object-contain", className)}
      />
    );
  const Icon = presentation.Icon;
  return (
    <Icon
      className={cn("size-4 shrink-0", accentTextClasses[presentation.color], className)}
      aria-hidden="true"
    />
  );
}

export function ServiceBadge({
  name,
  icon,
  color,
  className,
}: {
  name: string;
  icon?: string | null | undefined;
  color?: string | null | undefined;
  className?: string;
}) {
  const presentation = servicePresentation({
    name,
    ...(icon === undefined ? {} : { icon }),
    ...(color === undefined ? {} : { color }),
  });
  const Icon = presentation.Icon;
  return (
    <span
      className={cn(
        badgeVariants({ variant: "outline" }),
        "max-w-full gap-1.5 border",
        presentation.className,
        className,
      )}
      data-selection-icon={presentation.icon}
      data-selection-color={presentation.color}
    >
      {presentation.hochgeladen ? (
        <img
          src={symbolQuelle(presentation.hochgeladen)}
          alt=""
          aria-hidden="true"
          className="size-3.5 shrink-0 object-contain"
        />
      ) : (
        <Icon className="size-3.5" aria-hidden="true" />
      )}
      <span className="truncate">{name}</span>
    </span>
  );
}

export const SelectionBadge = ServiceBadge;

/**
 * Toggle-Chip für Mehrfachauswahl (z.B. Leistungen im Eventformular).  Anders
 * als `ServiceBadge` steckt hier kein Badge in einem Button -- ausgewählt ist
 * der ganze Chip in der Servicefarbe gefüllt, nicht ausgewählt bleibt er ein
 * schlichter Outline-Chip. Ein Formkörper statt zweier verschachtelter.
 */
export function SelectionToggleChip({
  name,
  icon,
  color,
  selected,
  onClick,
}: {
  name: string;
  icon?: string | null | undefined;
  color?: string | null | undefined;
  selected: boolean;
  onClick: () => void;
}) {
  const presentation = servicePresentation({
    name,
    ...(icon === undefined ? {} : { icon }),
    ...(color === undefined ? {} : { color }),
  });
  const Icon = presentation.Icon;
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-sm transition-colors",
        selected
          ? cn("border-transparent font-medium text-white", fillClasses[presentation.color])
          : "border-input text-muted-foreground hover:text-foreground",
      )}
    >
      {presentation.hochgeladen ? (
        <img
          src={symbolQuelle(presentation.hochgeladen)}
          alt=""
          aria-hidden="true"
          className="size-3.5 shrink-0 object-contain"
        />
      ) : (
        <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      )}
      <span className="truncate">{name}</span>
    </button>
  );
}
