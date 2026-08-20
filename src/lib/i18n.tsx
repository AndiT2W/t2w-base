import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Locale = "de" | "en";

const translations = {
  de: {
    "app.name": "TIME2WIN", "app.subtitle": "Eventverwaltung", "nav.modules": "Module", "nav.more": "Weitere",
    "nav.overview": "Übersicht", "nav.events": "Veranstaltungen", "nav.tasks": "Aufgaben", "nav.contacts": "Kontakte", "nav.offers": "Angebote", "nav.invoices": "Rechnungen", "nav.settings": "Einstellungen", "nav.calendar": "Kalender", "nav.variants": "Design-Varianten", "nav.styleguide": "Styleguide", "nav.demo": "Demo-Zustand · keine echten Integrationen", "language": "Sprache", "language.de": "Deutsch", "language.en": "Englisch", "actions.open": "Öffnen", "actions.save": "Speichern", "actions.createEvent": "Event anlegen", "search": "Global suchen …", "status.all": "Alle Status", "status.anfrage": "Anfrage", "status.angebot-gesendet": "Angebot gesendet", "status.zugesagt": "Zugesagt", "status.abgesagt": "Abgesagt", "status.akquise": "Akquise", "status.datum-pruefen": "Datum prüfen", "events.empty": "Keine Events für die aktuelle Filterauswahl.", "overview.search": "Event, Veranstalter oder Ort suchen …", "overview.next": "Events nächste 14 Tage", "overview.tasks": "Offene Aufgaben", "overview.rows": "Zeilen · Aufg. = offene Aufgaben, OL/SP = Outlook- bzw. SharePoint-Ordner"
  },
  en: {
    "app.name": "TIME2WIN", "app.subtitle": "Event management", "nav.modules": "Modules", "nav.more": "More",
    "nav.overview": "Overview", "nav.events": "Events", "nav.tasks": "Tasks", "nav.contacts": "Contacts", "nav.offers": "Offers", "nav.invoices": "Invoices", "nav.settings": "Settings", "nav.calendar": "Calendar", "nav.variants": "Design variants", "nav.styleguide": "Style guide", "nav.demo": "Demo state · no real integrations", "language": "Language", "language.de": "German", "language.en": "English", "actions.open": "Open", "actions.save": "Save", "actions.createEvent": "Create event", "search": "Search …", "status.all": "All statuses", "status.anfrage": "Request", "status.angebot-gesendet": "Offer sent", "status.zugesagt": "Confirmed", "status.abgesagt": "Cancelled", "status.akquise": "Prospecting", "status.datum-pruefen": "Check date", "events.empty": "No events match the current filters.", "overview.search": "Search event, organizer or location …", "overview.next": "Events in next 14 days", "overview.tasks": "Open tasks", "overview.rows": "Rows · open tasks, OL/SP = Outlook and SharePoint folders"
  }
} as const;

type Key = keyof typeof translations.de;
const LocaleContext = createContext<{ locale: Locale; setLocale: (locale: Locale) => void; t: (key: Key) => string; formatDate: (iso: string) => string; formatNumber: (value: number) => string }>({ locale: "de", setLocale: () => {}, t: (key) => translations.de[key], formatDate: (iso) => iso, formatNumber: String });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => (typeof window !== "undefined" && window.localStorage.getItem("t2w-locale") === "en" ? "en" : "de"));
  const setLocale = (next: Locale) => { setLocaleState(next); window.localStorage.setItem("t2w-locale", next); };
  useEffect(() => {
    const stored = window.localStorage.getItem("t2w-locale");
    if (stored === "en" && locale !== "en") setLocaleState("en");
    document.documentElement.lang = locale;
  }, [locale]);
  const value = useMemo(() => ({ locale, setLocale, t: (key: Key) => translations[locale][key] ?? translations.de[key], formatDate: (iso: string) => new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB").format(new Date(`${iso}T00:00:00`)), formatNumber: (n: number) => new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB").format(n) }), [locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n() { return useContext(LocaleContext); }
