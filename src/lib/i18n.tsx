import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Locale = "de" | "en";

export const translations = {
  de: {
    "detail.basicData": "Stammdaten", "detail.files": "Dateien", "detail.communication": "Kommunikation",
    "app.name": "TIME2WIN", "app.subtitle": "Eventverwaltung", "nav.modules": "Module", "nav.more": "Weitere",
    "nav.overview": "Übersicht", "nav.events": "Veranstaltungen", "nav.tasks": "Aufgaben", "nav.contacts": "Kontakte", "nav.offers": "Angebote", "nav.invoices": "Rechnungen", "nav.settings": "Einstellungen", "nav.calendar": "Kalender", "nav.variants": "Design-Varianten", "nav.styleguide": "Styleguide", "nav.demo": "Demo-Zustand · keine echten Integrationen", "language": "Sprache", "language.de": "Deutsch", "language.en": "Englisch", "actions.open": "Öffnen", "actions.save": "Speichern", "actions.createEvent": "Event anlegen", "search": "Global suchen …", "status.all": "Alle Status", "status.anfrage": "Anfrage", "status.angebot-gesendet": "Angebot gesendet", "status.zugesagt": "Zugesagt", "status.abgesagt": "Abgesagt", "status.akquise": "Akquise", "status.datum-pruefen": "Datum prüfen", "events.empty": "Keine Events für die aktuelle Filterauswahl.", "overview.search": "Event, Veranstalter oder Ort suchen …", "overview.next": "Events nächste 14 Tage", "overview.tasks": "Offene Aufgaben", "overview.rows": "Zeilen · Aufg. = offene Aufgaben, OL/SP = Outlook- bzw. SharePoint-Ordner"
  },
  en: {
    "detail.basicData": "Basic data", "detail.files": "Files", "detail.communication": "Communication",
    "app.name": "TIME2WIN", "app.subtitle": "Event management", "nav.modules": "Modules", "nav.more": "More",
    "nav.overview": "Overview", "nav.events": "Events", "nav.tasks": "Tasks", "nav.contacts": "Contacts", "nav.offers": "Offers", "nav.invoices": "Invoices", "nav.settings": "Settings", "nav.calendar": "Calendar", "nav.variants": "Design variants", "nav.styleguide": "Style guide", "nav.demo": "Demo state · no real integrations", "language": "Language", "language.de": "German", "language.en": "English", "actions.open": "Open", "actions.save": "Save", "actions.createEvent": "Create event", "search": "Search …", "status.all": "All statuses", "status.anfrage": "Request", "status.angebot-gesendet": "Offer sent", "status.zugesagt": "Confirmed", "status.abgesagt": "Cancelled", "status.akquise": "Prospecting", "status.datum-pruefen": "Check date", "events.empty": "No events match the current filters.", "overview.search": "Search event, organizer or location …", "overview.next": "Events in next 14 days", "overview.tasks": "Open tasks", "overview.rows": "Rows · open tasks, OL/SP = Outlook and SharePoint folders"
  }
} as const;

const pageTextTranslations: Record<string, string> = {
  "Eventverwaltung": "Event management", "Module": "Modules", "Weitere": "More", "Zentrale Datenquelle: Event-Service": "Central data source: event service",
  "Übersicht": "Overview", "Veranstaltungen": "Events", "Aufgaben": "Tasks", "Kontakte": "Contacts", "Angebote": "Offers", "Rechnungen": "Invoices", "Einstellungen": "Settings", "Kalender": "Calendar", "Design-Varianten": "Design variants", "Styleguide": "Style guide",
  "Stammdaten": "Basic data", "Kontakte": "Contacts", "Aufgaben": "Tasks", "Dateien": "Files", "Kommunikation": "Communication", "Liste": "List", "Speichern": "Save", "Abbrechen": "Cancel", "Bearbeiten": "Edit", "Öffnen": "Open", "Event anlegen": "Create event", "Event bearbeiten": "Edit event",
  "Keine Events": "No events", "Keine Dateien verknüpft.": "No files linked.", "Keine Kommunikation erfasst.": "No communication recorded.", "Keine Kontakte hinterlegt.": "No contacts recorded.", "Keine Aufgaben angelegt.": "No tasks created.", "Noch keine Kontakte hinterlegt.": "No contacts recorded yet.", "Noch keine Aufgaben angelegt.": "No tasks created yet.", "Keine aktiven Events.": "No active events.", "Keine Events für diese Auswahl.": "No events for this selection.", "Keine Events für die aktuelle Filterauswahl.": "No events match the current filters.", "Keine Aufgaben für diese Auswahl.": "No tasks for this selection.", "Keine offenen Angebote.": "No open offers.", "Keine abrechnungsreifen Events.": "No billable events.",
  "Eventcode": "Event code", "Veranstalter": "Organizer", "Ort": "Location", "Sportart": "Sport", "Start": "Start", "Ende": "End", "Verantwortlicher": "Responsible person", "Notizen": "Notes", "Teilnehmer": "Participants", "Teilnehmerprognose": "Participant forecast", "Status": "Status",
  "TIME2WIN-Verknüpfung": "TIME2WIN connection", "Stammdaten speichern": "Save basic data", "Outlook-Ordner": "Outlook folder", "Outlook-Web-Link": "Outlook web link", "SharePoint-Ordner": "SharePoint folder", "Keine Kommunikation erfasst": "No communication recorded", "Kommunikation wird vorbereitet.": "Communication is being prepared.", "Noch keine Aufgaben angelegt": "No tasks created yet", "Keine Dateien verknüpft": "No files linked", "in Einstellungen noch nicht hinterlegt": "not configured in settings yet", "Event nicht gefunden": "Event not found", "Zur Eventliste": "Back to event list", "Erneut versuchen": "Try again",
  "Kunden & Kontakte": "Customers & contacts", "Ansprechpartner aller Veranstaltungen zentral durchsuchen.": "Search contacts across all events.", "Keine Kontakte gefunden.": "No contacts found.", "Kontakt anlegen": "Create contact", "Kunde anlegen": "Create customer", "Bestehender Kontakt": "Existing contact", "Bestehender Kunde": "Existing customer", "E-Mail": "Email", "Telefon": "Phone", "Name": "Name", "Kunden": "Customers", "Personen": "People",
  "Modul in Vorbereitung · abgeleitet aus durchgeführten Events": "Module in preparation · based on completed events", "Modul in Vorbereitung · abgeleitet aus unbestätigten Events": "Module in preparation · based on unconfirmed events", "Aufgabenliste über alle Events hinweg, sortiert nach Fälligkeit.": "Task list across all events, sorted by due date.", "Offene Aufgaben": "Open tasks", "Offene Angebote": "Open offers", "Keine Einträge.": "No entries.", "Noch keine Einträge.": "No entries yet.", "Archiviert": "Archived", "Archivierte Events erscheinen nur im Archivfilter.": "Archived events appear only in the archive filter.", "Eventname": "Event name", "Startdatum": "Start date", "Enddatum": "End date", "Änderungen speichern": "Save changes", "Änderungen gespeichert.": "Changes saved.", "Das Startdatum ist verpflichtend.": "Start date is required.", "Ordnerverknüpfungen": "Folder links", "Vorschlag übernehmen": "Use suggestion", "Synchronisiere …": "Synchronizing …", "Outlook-Ordner synchronisieren": "Sync Outlook folder", "Öffnet den konkreten Ordner direkt in Outlook Web.": "Opens the specific folder directly in Outlook Web.", "Ansicht des verknüpften SharePoint-Ordners.": "View of the linked SharePoint folder.", "Keine aktiven Events.": "No active events.", "aktive Events": "active events", "Zeilen": "Rows", "aktive Event": "active event",
  "Event": "Event", "Veranstaltungsansichten": "Event views", "Alle Zeiträume": "All periods", "Alle Status": "All statuses", "Kommend": "Upcoming", "Laufend": "Ongoing", "Vergangen": "Past", "Aktueller Monat": "Current month", "Archiv": "Archive", "Nur aktive": "Active only", "Nur archivierte": "Archived only", "Aktive & Archiv": "Active & archived", "Aktion": "Action", "Zeitraum": "Period", "Wird geladen …": "Loading …", "Startdatum *": "Start date *", "Enddatum (optional)": "End date (optional)", "Leer = entspricht dem Startdatum.": "Empty = same as start date.", "Eventcode-Vorschau": "Event code preview", "Neues Event anlegen": "Create new event", "Zurück": "Back", "Weiter": "Next", "Schließen": "Close", "Jahr": "Year", "Site-URL": "Site URL", "Aktionen": "Actions", "SharePoint Jahres-Sites": "SharePoint year sites", "Ordnername": "Folder name", "Outlook-Integration": "Outlook integration", "Verbindungsstatus": "Connection status", "Verbindung prüfen": "Check connection", "Outlook öffnen": "Open Outlook", "Outlook-Jahresordner hinzufügen": "Add Outlook year folder", "Anmelden": "Sign in", "Bitte anmelden, um Events zu verwalten.": "Please sign in to manage events.", "Passwort": "Password", "Keine Einträge.": "No entries.", "Outlook-Ordner verschieben?": "Move Outlook folder?", "Abbrechen": "Cancel", "Allgemein": "General", "SharePoint Jahres-Sites": "SharePoint year sites", "Outlook-Jahresordner": "Outlook year folders", "Jahresordnername": "Year folder name", "Jahres-Site entfernen": "Remove year site", "Outlook-Jahresordner öffnen": "Open Outlook year folder", "Outlook-Jahresordner entfernen": "Remove Outlook year folder", "Graph-Verbindung wird beim ersten Ordner-Sync geprüft.": "The Graph connection is checked on the first folder sync.", "UPN oder Adresse der verbundenen Mailbox.": "UPN or address of the connected mailbox.", "Outlook-Elternordner:": "Outlook parent folder:", "Posteingang": "Inbox", "Automatische Ordnerstruktur": "Automatic folder structure", "Jahresordner / Quartal / Eventcode": "Year folder / quarter / event code", "Neu anlegen": "Create new", "Suche über Stammdaten": "Search basic data", "Detail schließen": "Close details", "Dialog schließen": "Close dialog", "Vorname": "First name", "Nachname": "Last name", "Kundenname": "Customer name", "Design-Galerie": "Design gallery", "Event Workspace": "Event workspace", "Suchen …": "Search …", "Events durchsuchen": "Search events", "Verantw.": "Responsible", "Ordner": "Folder", "Ri": "Direction", "Keine Events": "No events", "Outlook und SharePoint": "Outlook and SharePoint",
  "Eventcode, Name, Veranstalter, Ort …": "Event code, name, organizer, location …",
  "Event, Veranstalter oder Ort suchen …": "Search event, organizer or location …",
  "Aufgabe, Event, Person …": "Search task, event, person …",
  "Modul in Vorbereitung · abgeleitet aus unbestätigten Events": "Module in preparation · based on unconfirmed events",
  "Modul in Vorbereitung · abgeleitet aus durchgeführten Events": "Module in preparation · based on completed events",
  "Events ohne Zusage – sie benötigen ein Angebot oder eine Bestätigung.": "Events without confirmation need an offer or confirmation.",
  "durchgeführten Events, die abgerechnet werden müssen.": "completed events that need to be invoiced.",
  "Alle offenen und erledigten Eventaufgaben mit Fälligkeit und Verantwortlichen.": "All open and completed event tasks with due dates and owners.",
  "Outlook- und SharePoint-Ordnerkonventionen zentral verwalten.": "Manage Outlook and SharePoint folder conventions centrally.",
  "Einstellungen gespeichert.": "Settings saved.",
  "Einstellungen konnten nicht gespeichert werden.": "Settings could not be saved.",
  "Design-Galerie": "Design gallery", "Gantt": "Gantt", "Timeline Planner": "Timeline Planner", "Veranstaltungen": "Events", "Events nächste 14 Tage": "Events in next 14 days", "Alle aktiven Events": "All active events",
  "Liste": "List", "Kalender": "Calendar", "Monat": "Month", "Woche": "Week", "Tag": "Day", "Heute": "Today", "Weitere": "More", "Aktion": "Action", "Eventname": "Event name", "Eventcode": "Event code", "Veranstalter": "Organizer", "Ort": "Location", "Verantwortlicher": "Responsible", "Notizen": "Notes", "Sportart": "Sport", "Teilnehmer": "Participants", "Status": "Status", "Angebot": "Offer", "Rechnung": "Invoice", "Kunde": "Customer", "Typ": "Type", "UID": "UID", "IBAN": "IBAN", "Eventrollen": "Event roles", "Jahr": "Year", "Wird geladen …": "Loading …", "Keine offenen Angebote.": "No open offers.", "Keine abrechnungsreifen Events.": "No billable events.", "Keine Aufgaben für diese Auswahl.": "No tasks for this selection.", "Keine Events für diese Auswahl.": "No events for this selection.", "Keine Events für die aktuelle Filterauswahl.": "No events match the current filters.", "Keine Kontakte gefunden.": "No contacts found.", "Noch keine Kontakte hinterlegt.": "No contacts recorded yet.", "Noch keine Aufgaben angelegt.": "No tasks created yet.", "Keine Dateien verknüpft.": "No files linked.", "Keine Kommunikation erfasst.": "No communication recorded.", "Variante öffnen →": "Open variant →", "Klassische Eventliste mit Filterleiste und konfigurierbaren Team-Spalten.": "Classic event list with filters and configurable team columns.", "Event- und kundenzentriert": "Event- and customer-focused",
  "Fällig": "Due", "Aufgabe": "Task", "Allgemein": "General", "SharePoint Jahres-Sites": "SharePoint year sites", "Jahres-Site entfernen": "Remove year site", "Outlook-Jahresordner": "Outlook year folders", "Ordnername": "Folder name", "Outlook-Integration": "Outlook integration", "Verbindungsstatus": "Connection status", "Verbindung prüfen": "Check connection", "Outlook öffnen": "Open Outlook", "Outlook-Mailbox": "Outlook mailbox", "Posteingang": "Inbox", "Automatische Ordnerstruktur": "Automatic folder structure", "Kundenname": "Customer name", "Vorname": "First name", "Nachname": "Last name", "Telefon": "Phone", "E-Mail": "Email", "Hauptnavigation": "Main navigation", "Navigation öffnen": "Open navigation", "Ordnerverknüpfungen": "Folder links", "Archiviert": "Archived", "Enddatum": "End date", "Änderungen speichern": "Save changes", "Event anlegen": "Create event", "Neues Event anlegen": "Create new event", "Angebote": "Offers", "Rechnungen": "Invoices", "Einstellungen": "Settings",
  "Arbeitsbereiche": "Work areas", "Events nächste 14 Tage": "Events in next 14 days", "Risiken": "Risks", "finanzielle Lücken": "financial gaps", "Standardansicht": "Default view", "Produktionsplanung": "Production planning", "Monats- und Wochenumschaltung im Zentrum": "Month and week switching at the center", "Mehrtägige Events als horizontale Balken": "Multi-day events as horizontal bars", "Filter, gespeicherte Ansichten und Statuslegende links, Detail-Drawer rechts": "Filters, saved views and status legend on the left, detail drawer on the right", "Große Eventkarten statt Tabelle": "Large event cards instead of a table", "Nächste Aktion, Verantwortliche und Ordnerstatus je Karte": "Next action, owners and folder status per card", "Detailbereich mit Stammdaten, Kontakten, Aufgaben, Dateien, Kommunikation": "Detail area with basic data, contacts, tasks, files and communication", "Statuslegende": "Status legend", "Schnellfilter": "Quick filters", "Alle Events": "All events", "Offene Aufgaben": "Open tasks", "Ohne Ordner": "Without folder", "Suche über Stammdaten": "Search basic data", "Event oder Kunde suchen …": "Search event or customer …", "Suchen …": "Search …", "Monat": "Month", "Woche": "Week", "Tag": "Day", "Woche ab": "Week of", "Keine Events": "No events", "Kunde": "Customer", "Person": "Person", "Ansprechpartner": "Contact person", "Rolle": "Role", "Veranstalter": "Organizer", "Auszahlungsempfänger": "Payee", "Rechnungsempfänger": "Invoice recipient", "Bearbeiten": "Edit", "Löschen": "Delete", "Entfernen": "Remove", "Öffnen": "Open", "Anmelden": "Sign in", "Bitte anmelden, um Events zu verwalten.": "Please sign in to manage events.", "Anmeldung fehlgeschlagen.": "Sign-in failed.", "Passwort": "Password",
};

export function translatePageText(text: string, locale: Locale) {
  return locale === "en" ? pageTextTranslations[text] ?? text : text;
}

type Key = keyof typeof translations.de;
const LocaleContext = createContext<{ locale: Locale; setLocale: (locale: Locale) => void; t: (key: Key) => string; formatDate: (iso: string) => string; formatNumber: (value: number) => string }>({ locale: "de", setLocale: () => {}, t: (key) => translations.de[key], formatDate: (iso) => iso, formatNumber: String });

export function I18nProvider({ children, initialLocale = "de" }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const setLocale = (next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem("t2w-locale", next);
    document.documentElement.lang = next;
  };
  useEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem("t2w-locale", locale);
  }, [locale]);
  useEffect(() => {
    if (locale !== "en") return;
    const translate = () => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const element = node.parentElement;
        if (element?.closest("script,style,[data-i18n-ignore]")) continue;
        const value = node.nodeValue?.trim();
        const translated = value ? pageTextTranslations[value] : undefined;
        if (translated && node.nodeValue) node.nodeValue = node.nodeValue.replace(value, translated);
      }
    };
    const timer = window.setTimeout(translate, 150);
    const observer = new MutationObserver(() => window.setTimeout(translate, 0));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => { window.clearTimeout(timer); observer.disconnect(); };
  }, [locale]);
  useEffect(() => {
    const queryLocale = new URLSearchParams(window.location.search).get("locale");
    const storedLocale = window.localStorage.getItem("t2w-locale");
    const next = queryLocale === "en" || queryLocale === "de" ? queryLocale : storedLocale;
    if (next === "en" || next === "de") setLocaleState(next);
  }, []);
  const value = useMemo(() => ({ locale, setLocale, t: (key: Key) => translations[locale][key] ?? translations.de[key], formatDate: (iso: string) => new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB").format(new Date(`${iso}T00:00:00`)), formatNumber: (n: number) => new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB").format(n) }), [locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n() { return useContext(LocaleContext); }
