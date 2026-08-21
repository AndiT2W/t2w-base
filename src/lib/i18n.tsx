import { createContext, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from "react";

export type Locale = "de" | "en";

export const translations = {
  de: {
    "app.name": "TIME2WIN", "app.subtitle": "Eventverwaltung", "nav.modules": "Module", "nav.more": "Weitere",
    "nav.overview": "Übersicht", "nav.events": "Veranstaltungen", "nav.tasks": "Aufgaben", "nav.contacts": "Kontakte", "nav.offers": "Angebote", "nav.invoices": "Rechnungen", "nav.settings": "Einstellungen", "nav.calendar": "Kalender", "nav.variants": "Design-Varianten", "nav.styleguide": "Styleguide", "nav.demo": "Demo-Zustand · keine echten Integrationen", "language": "Sprache", "language.de": "Deutsch", "language.en": "Englisch", "actions.open": "Öffnen", "actions.save": "Speichern", "actions.createEvent": "Event anlegen", "search": "Global suchen …", "status.all": "Alle Status", "status.anfrage": "Anfrage", "status.angebot-gesendet": "Angebot gesendet", "status.zugesagt": "Zugesagt", "status.abgesagt": "Abgesagt", "status.akquise": "Akquise", "status.datum-pruefen": "Datum prüfen", "events.empty": "Keine Events für die aktuelle Filterauswahl.", "overview.search": "Event, Veranstalter oder Ort suchen …", "overview.next": "Events nächste 14 Tage", "overview.tasks": "Offene Aufgaben", "overview.rows": "Zeilen · Aufg. = offene Aufgaben, OL/SP = Outlook- bzw. SharePoint-Ordner"
  },
  en: {
    "app.name": "TIME2WIN", "app.subtitle": "Event management", "nav.modules": "Modules", "nav.more": "More",
    "nav.overview": "Overview", "nav.events": "Events", "nav.tasks": "Tasks", "nav.contacts": "Contacts", "nav.offers": "Offers", "nav.invoices": "Invoices", "nav.settings": "Settings", "nav.calendar": "Calendar", "nav.variants": "Design variants", "nav.styleguide": "Style guide", "nav.demo": "Demo state · no real integrations", "language": "Language", "language.de": "German", "language.en": "English", "actions.open": "Open", "actions.save": "Save", "actions.createEvent": "Create event", "search": "Search …", "status.all": "All statuses", "status.anfrage": "Request", "status.angebot-gesendet": "Offer sent", "status.zugesagt": "Confirmed", "status.abgesagt": "Cancelled", "status.akquise": "Prospecting", "status.datum-pruefen": "Check date", "events.empty": "No events match the current filters.", "overview.search": "Search event, organizer or location …", "overview.next": "Events in next 14 days", "overview.tasks": "Open tasks", "overview.rows": "Rows · open tasks, OL/SP = Outlook and SharePoint folders"
  }
} as const;

const pageTextTranslations: Record<string, string> = {
  "Eventverwaltung": "Event management", "Module": "Modules", "Weitere": "More", "Zentrale Datenquelle: Event-Service": "Central data source: event service",
  "Übersicht": "Overview", "Veranstaltungen": "Events", "Aufgaben": "Tasks", "Kontakte": "Contacts", "Angebote": "Offers", "Rechnungen": "Invoices", "Einstellungen": "Settings", "Kalender": "Calendar", "Design-Varianten": "Design variants", "Styleguide": "Style guide",
  "Stammdaten": "Basic data", "Dateien": "Files", "Kommunikation": "Communication", "Liste": "List", "Speichern": "Save", "Abbrechen": "Cancel", "Bearbeiten": "Edit", "Öffnen": "Open", "Event anlegen": "Create event", "Event bearbeiten": "Edit event",
  "Keine Events": "No events", "Keine Dateien verknüpft.": "No files linked.", "Keine Kommunikation erfasst.": "No communication recorded.", "Keine Kontakte hinterlegt.": "No contacts recorded.", "Keine Aufgaben angelegt.": "No tasks created.", "Noch keine Kontakte hinterlegt.": "No contacts recorded yet.", "Noch keine Aufgaben angelegt.": "No tasks created yet.", "Keine aktiven Events.": "No active events.", "Keine Events für diese Auswahl.": "No events for this selection.", "Keine Events für die aktuelle Filterauswahl.": "No events match the current filters.", "Keine Aufgaben für diese Auswahl.": "No tasks for this selection.", "Keine offenen Angebote.": "No open offers.", "Keine abrechnungsreifen Events.": "No billable events.",
  "Eventcode": "Event code", "Veranstalter": "Organizer", "Ort": "Location", "Sportart": "Sport", "Start": "Start", "Ende": "End", "Verantwortlicher": "Responsible person", "Notizen": "Notes", "Teilnehmer": "Participants", "Teilnehmerprognose": "Participant forecast", "Status": "Status",
};

type Key = keyof typeof translations.de;
const LocaleContext = createContext<{ locale: Locale; setLocale: (locale: Locale) => void; t: (key: Key) => string; formatDate: (iso: string) => string; formatNumber: (value: number) => string }>({ locale: "de", setLocale: () => {}, t: (key) => translations.de[key], formatDate: (iso) => iso, formatNumber: String });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return "de";
    const queryLocale = new URLSearchParams(window.location.search).get("locale");
    return queryLocale === "en" || window.localStorage.getItem("t2w-locale") === "en" ? "en" : "de";
  });
  const setLocale = (next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem("t2w-locale", next);
    document.documentElement.lang = next;
  };
  useLayoutEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem("t2w-locale", locale);
  }, [locale]);
  const value = useMemo(() => ({ locale, setLocale, t: (key: Key) => translations[locale][key] ?? translations.de[key], formatDate: (iso: string) => new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB").format(new Date(`${iso}T00:00:00`)), formatNumber: (n: number) => new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB").format(n) }), [locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n() { return useContext(LocaleContext); }
