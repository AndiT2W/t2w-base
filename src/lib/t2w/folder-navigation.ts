import { jahr } from "./eventcode";
import type { Settings, T2WEvent } from "./types";

export type FolderDestination = { href: string | null; available: boolean };

export function resolveEventFolderNavigation(
  event: Pick<T2WEvent, "start" | "outlookOrdner" | "outlookWebUrl" | "sharepointOrdner">,
  settings: Pick<Settings, "jahresSites">,
) {
  const outlookHref =
    event.outlookWebUrl ?? (event.outlookOrdner ? "https://outlook.office.com/mail/" : null);
  const site = settings.jahresSites.find((entry) => entry.jahr === jahr(event.start));
  const sharepointHref =
    event.sharepointOrdner && site
      ? `${site.url.replace(/\/$/, "")}/${event.sharepointOrdner
          .split("/")
          .map(encodeURIComponent)
          .join("/")}`
      : null;

  return {
    outlook: { href: outlookHref, available: Boolean(outlookHref) } satisfies FolderDestination,
    sharepoint: {
      href: sharepointHref,
      available: Boolean(sharepointHref),
    } satisfies FolderDestination,
  };
}
