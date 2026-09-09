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
  Mountain,
  Monitor,
  Music,
  Package,
  PanelsTopLeft,
  Radio,
  Printer,
  Settings,
  Smartphone,
  Star,
  Tag,
  Trophy,
  UserRound,
  Video,
  Wifi,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  | "bell"
  | "calendar"
  | "circle-check"
  | "cloud"
  | "headphones"
  | "laptop"
  | "mail"
  | "monitor"
  | "music"
  | "package"
  | "printer"
  | "settings"
  | "star"
  | "tag"
  | "wifi"
  | "zap"
  | "euro"
  | "bike"
  | "footprints"
  | "mountain"
  | "trophy"
  | "waves";
type ColorKey =
  | "sky"
  | "lime"
  | "violet"
  | "amber"
  | "rose"
  | "orange"
  | "indigo"
  | "teal"
  | "cyan"
  | "fuchsia"
  | "emerald"
  | "green"
  | "yellow"
  | "red"
  | "pink"
  | "purple"
  | "blue"
  | "slate"
  | "stone"
  | "neutral";
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
  bell: Bell,
  calendar: Calendar,
  "circle-check": CircleCheck,
  cloud: Cloud,
  headphones: Headphones,
  laptop: Laptop,
  mail: Mail,
  monitor: Monitor,
  music: Music,
  package: Package,
  printer: Printer,
  settings: Settings,
  star: Star,
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
  sky: "border-sky-300 bg-sky-100 text-sky-950 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-100",
  lime: "border-lime-300 bg-lime-100 text-lime-950 dark:border-lime-800 dark:bg-lime-950 dark:text-lime-100",
  violet:
    "border-violet-300 bg-violet-100 text-violet-950 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-100",
  amber:
    "border-amber-300 bg-amber-100 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100",
  rose: "border-rose-300 bg-rose-100 text-rose-950 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-100",
  orange:
    "border-orange-300 bg-orange-100 text-orange-950 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-100",
  indigo:
    "border-indigo-300 bg-indigo-100 text-indigo-950 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-100",
  teal: "border-teal-300 bg-teal-100 text-teal-950 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-100",
  cyan: "border-cyan-300 bg-cyan-100 text-cyan-950 dark:border-cyan-800 dark:bg-cyan-950 dark:text-cyan-100",
  fuchsia:
    "border-fuchsia-300 bg-fuchsia-100 text-fuchsia-950 dark:border-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-100",
  emerald:
    "border-emerald-300 bg-emerald-100 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100",
  green:
    "border-green-300 bg-green-100 text-green-950 dark:border-green-800 dark:bg-green-950 dark:text-green-100",
  yellow:
    "border-yellow-300 bg-yellow-100 text-yellow-950 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100",
  red: "border-red-300 bg-red-100 text-red-950 dark:border-red-800 dark:bg-red-950 dark:text-red-100",
  pink: "border-pink-300 bg-pink-100 text-pink-950 dark:border-pink-800 dark:bg-pink-950 dark:text-pink-100",
  purple:
    "border-purple-300 bg-purple-100 text-purple-950 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-100",
  blue: "border-blue-300 bg-blue-100 text-blue-950 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100",
  slate:
    "border-slate-300 bg-slate-100 text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
  stone:
    "border-stone-300 bg-stone-100 text-stone-950 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100",
  neutral: "border-border bg-muted text-foreground",
};
const defaults: Record<string, Presentation> = {
  UHF: { icon: "radio", color: "sky" },
  Active: { icon: "activity", color: "lime" },
  Streaming: { icon: "radio", color: "violet" },
  Foto: { icon: "camera", color: "amber" },
  "Video (iRewind)": { icon: "video", color: "rose" },
  GPS: { icon: "map-pin", color: "orange" },
  Virtuell: { icon: "panels-top-left", color: "indigo" },
  "Anmeldung (only)": { icon: "clipboard-list", color: "teal" },
  App: { icon: "smartphone", color: "cyan" },
  Jörg: { icon: "user-round", color: "fuchsia" },
};
export const SERVICE_ICON_OPTIONS: { value: IconKey; label: string }[] = [
  { value: "radio", label: "Funk" },
  { value: "activity", label: "Aktivität" },
  { value: "camera", label: "Kamera" },
  { value: "video", label: "Video" },
  { value: "map-pin", label: "Standort" },
  { value: "panels-top-left", label: "Virtuell" },
  { value: "clipboard-list", label: "Anmeldung" },
  { value: "smartphone", label: "App" },
  { value: "user-round", label: "Person" },
  { value: "bell", label: "Glocke" },
  { value: "calendar", label: "Kalender" },
  { value: "circle-check", label: "Bestätigung" },
  { value: "cloud", label: "Cloud" },
  { value: "headphones", label: "Headset" },
  { value: "laptop", label: "Laptop" },
  { value: "mail", label: "E-Mail" },
  { value: "monitor", label: "Monitor" },
  { value: "music", label: "Musik" },
  { value: "package", label: "Paket" },
  { value: "printer", label: "Drucker" },
  { value: "settings", label: "Einstellungen" },
  { value: "star", label: "Favorit" },
  { value: "tag", label: "Tag" },
  { value: "wifi", label: "WLAN" },
  { value: "zap", label: "Blitz" },
  { value: "euro", label: "Euro" },
];
export const SPORT_ICON_OPTIONS: { value: IconKey; label: string }[] = [
  { value: "footprints", label: "Laufen" },
  { value: "bike", label: "Radfahren" },
  { value: "waves", label: "Schwimmen" },
  { value: "mountain", label: "Bergsport" },
  { value: "trophy", label: "Wettkampf" },
  { value: "activity", label: "Sport" },
  { value: "calendar", label: "Veranstaltung" },
  { value: "euro", label: "Euro" },
];
export const SERVICE_COLOR_OPTIONS: { value: ColorKey; label: string }[] = [
  { value: "sky", label: "Blau" },
  { value: "lime", label: "Limette" },
  { value: "violet", label: "Violett" },
  { value: "amber", label: "Bernstein" },
  { value: "rose", label: "Rosé" },
  { value: "orange", label: "Orange" },
  { value: "indigo", label: "Indigo" },
  { value: "teal", label: "Türkis" },
  { value: "cyan", label: "Cyan" },
  { value: "fuchsia", label: "Fuchsia" },
  { value: "emerald", label: "Smaragd" },
  { value: "green", label: "Grün" },
  { value: "yellow", label: "Gelb" },
  { value: "red", label: "Rot" },
  { value: "pink", label: "Pink" },
  { value: "purple", label: "Lila" },
  { value: "blue", label: "Blau (kräftig)" },
  { value: "slate", label: "Schiefer" },
  { value: "stone", label: "Stein" },
  { value: "neutral", label: "Neutral" },
];
export function servicePresentation(service: {
  name: string;
  icon?: string | null;
  color?: string | null;
}) {
  const fallback = defaults[service.name] ?? {
    icon: "panels-top-left" as IconKey,
    color: "neutral" as ColorKey,
  };
  const icon = service.icon && service.icon in icons ? (service.icon as IconKey) : fallback.icon;
  const color =
    service.color && service.color in colorClasses ? (service.color as ColorKey) : fallback.color;
  return { Icon: icons[icon], className: colorClasses[color], icon, color };
}
export const selectionPresentation = servicePresentation;
export function ServiceBadge({
  name,
  icon,
  color,
}: {
  name: string;
  icon?: string | null;
  color?: string | null;
}) {
  const presentation = servicePresentation({
    name,
    ...(icon === undefined ? {} : { icon }),
    ...(color === undefined ? {} : { color }),
  });
  const Icon = presentation.Icon;
  return (
    <Badge className={`gap-1.5 border ${presentation.className}`} variant="outline">
      <Icon className="size-3.5" aria-hidden="true" />
      {name}
    </Badge>
  );
}

export const SelectionBadge = ServiceBadge;
