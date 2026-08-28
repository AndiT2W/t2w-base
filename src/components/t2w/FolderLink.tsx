import { FolderX, Mail, Share2 } from "lucide-react";
import type { ReactNode } from "react";

export function FolderLink({
  label,
  href,
  available,
  children,
  icon,
}: {
  label: string;
  href: string | null;
  available: boolean;
  children?: ReactNode;
  icon?: "outlook" | "sharepoint";
}) {
  const ServiceIcon = icon === "outlook" ? Mail : icon === "sharepoint" ? Share2 : FolderX;
  if (!available || !href)
    return (
      <span
        className="inline-flex items-center text-muted-foreground"
        title={`${label}: nicht verknüpft`}
        aria-label={`${label}: nicht verknüpft`}
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
        href={href}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-w-0 items-center gap-1 truncate text-primary hover:underline"
        title={`${label} öffnen`}
      >
        <ServiceIcon className="size-4 shrink-0" />
        <span className="sr-only">{label} öffnen</span>
      </a>
    </span>
  );
}
