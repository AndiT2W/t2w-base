import { FolderX, Mail, Share2 } from "lucide-react";
import type { EventResourceDestination } from "@/lib/t2w/folder-navigation";

export function FolderLink({ destination }: { destination: EventResourceDestination }) {
  const ServiceIcon =
    destination.icon === "outlook" ? Mail : destination.icon === "sharepoint" ? Share2 : FolderX;
  if (!destination.available || !destination.href)
    return (
      <span
        className="inline-flex items-center text-muted-foreground"
        title={destination.unavailableLabel}
        aria-label={destination.unavailableLabel}
      >
        <ServiceIcon className="size-4" />
      </span>
    );
  return (
    <span
      className="flex min-w-0 items-center gap-1.5"
      onClick={(event) => event.stopPropagation()}
    >
      <a
        href={destination.href}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-w-0 items-center gap-1 truncate text-primary hover:underline"
        title={destination.openLabel}
      >
        <ServiceIcon className="size-4 shrink-0" />
        <span className="sr-only">{destination.openLabel}</span>
      </a>
    </span>
  );
}
