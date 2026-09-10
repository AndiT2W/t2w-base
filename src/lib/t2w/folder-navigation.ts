import { jahr } from "./eventcode";
import type { Settings, T2WEvent } from "./types";

export type EventResourceDestination = {
  id: "outlook" | "sharepoint";
  label: string;
  icon: "outlook" | "sharepoint";
  href: string | null;
  available: boolean;
  openLabel: string;
  unavailableLabel: string;
};

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

  return [
    {
      id: "outlook",
      label: "Outlook",
      icon: "outlook",
      href: outlookHref,
      available: Boolean(outlookHref),
      openLabel: "Outlook öffnen",
      unavailableLabel: "Outlook: nicht verknüpft",
    },
    {
      id: "sharepoint",
      label: "SharePoint",
      icon: "sharepoint",
      href: sharepointHref,
      available: Boolean(sharepointHref),
      openLabel: "SharePoint öffnen",
      unavailableLabel: "SharePoint: nicht verknüpft",
    },
  ] satisfies EventResourceDestination[];
}
