import {
  Activity,
  Camera,
  ClipboardList,
  MapPin,
  PanelsTopLeft,
  Radio,
  Smartphone,
  UserRound,
  Video,
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
  | "user-round";
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
export function ServiceBadge({
  name,
  icon,
  color,
}: {
  name: string;
  icon?: string | null;
  color?: string | null;
}) {
  const presentation = servicePresentation({ name, icon, color });
  const Icon = presentation.Icon;
  return (
    <Badge className={`gap-1.5 border ${presentation.className}`} variant="outline">
      <Icon className="size-3.5" aria-hidden="true" />
      {name}
    </Badge>
  );
}
