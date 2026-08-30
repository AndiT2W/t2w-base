import { useEffect, useState, useSyncExternalStore } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  FolderPlus,
  FolderSync,
  HelpCircle,
  Link2,
  Mail,
  Phone,
  StickyNote,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StatusBadge } from "@/components/t2w/StatusBadge";
import { FolderLink } from "@/components/t2w/FolderLink";
import { useT2W } from "@/lib/t2w/store";
import { useCrm } from "@/lib/crm/store";
import { eventContactRoleChoices, selectionListChoices } from "@/lib/t2w/selection-list-workspace";
import { useI18n } from "@/lib/i18n";
import { formatDatum, formatZeitraum, heuteIso } from "@/lib/t2w/format";
import { buildEventcode, copyDateSuggestion, jahr } from "@/lib/t2w/eventcode";
import { createEventDetailWorkspace } from "@/lib/t2w/event-detail-workspace";
import { resolveEventFolderNavigation } from "@/lib/t2w/folder-navigation";
import { STATUS_LABEL, STATUS_ORDER, type EventStatus, type T2WEvent } from "@/lib/t2w/types";
import type { Kunde } from "@/lib/crm/types";

function RecipientMasterData({ recipient }: { recipient: Kunde }) {
  const address = [
    recipient.strasse,
    [recipient.plz, recipient.ort].filter(Boolean).join(" "),
    recipient.land,
  ]
    .filter(Boolean)
    .join(", ");
  return (
    <dl className="grid gap-x-5 gap-y-2 rounded-md border border-border bg-muted/30 p-3 text-sm sm:grid-cols-2">
      <div>
        <dt className="text-xs text-muted-foreground">Name</dt>
        <dd>
          <a
            className="text-primary hover:underline"
            href={`/kontakte?kunde=${encodeURIComponent(recipient.id)}`}
          >
            {recipient.name}
          </a>
        </dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Adresse</dt>
        <dd>{address || "—"}</dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">UID</dt>
        <dd>{recipient.uid || "—"}</dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">IBAN</dt>
        <dd>{recipient.iban || "—"}</dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">BIC</dt>
        <dd>{recipient.bic || "—"}</dd>
      </div>
    </dl>
  );
}

export const Route = createFileRoute("/events/$eventcode")({
  head: () => ({
    meta: [
      { title: "Eventdetails – TIME2WIN Eventverwaltung" },
      {
        name: "description",
        content:
          "Stammdaten, Kontakte, Aufgaben, Dateien und Kommunikation eines Events bearbeiten.",
      },
      { property: "og:title", content: "Eventdetails – TIME2WIN Eventverwaltung" },
      {
        property: "og:description",
        content: "Alle Informationen zu einem Event an einem Ort.",
      },
    ],
  }),
  component: EventDetail,
});

function EventDetail() {
  const { eventcode } = useParams({ from: "/events/$eventcode" });
  const { events, bereit } = useT2W();
  const event = events.find((e) => e.eventcode === eventcode);

  if (!bereit) {
    return <p className="py-16 text-center text-sm text-muted-foreground">Wird geladen …</p>;
  }

  if (!event) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-xl font-semibold text-foreground">Event nicht gefunden</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Für den Eventcode <span className="font-mono">{eventcode}</span> existiert kein Eintrag.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Zur Eventliste</Link>
        </Button>
      </div>
    );
  }

  return <DetailInhalt event={event} />;
}

function DetailInhalt({ event }: { event: T2WEvent }) {
  const { openEventSession, settings, selectionLists, events, kopiereEvent } = useT2W();
  const { personen, kunden, neuLaden } = useCrm();
  const { t } = useI18n();
  const [detailWorkspace] = useState(() =>
    createEventDetailWorkspace(openEventSession(event.id), {
      event,
      persons: personen,
      customers: kunden,
    }),
  );
  const detail = useSyncExternalStore(
    detailWorkspace.subscribe,
    detailWorkspace.snapshot,
    detailWorkspace.snapshot,
  );
  const { form } = detail;
  const [quartalsDialog, setQuartalsDialog] = useState(false);
  const [copyDialog, setCopyDialog] = useState(false);
  const initialCopy = copyDateSuggestion(event.start, event.ende);
  const [copyStart, setCopyStart] = useState(initialCopy.start);
  const [copyEnde, setCopyEnde] = useState(initialCopy.ende);
  const [copyName, setCopyName] = useState(() => {
    const fromYear = jahr(event.start);
    const toYear = jahr(initialCopy.start);
    return event.name.split(fromYear).length === 2
      ? event.name.replace(fromYear, toYear)
      : event.name;
  });
  const [copyCode, setCopyCode] = useState(() =>
    buildEventcode(
      copyName,
      initialCopy.start,
      events.map((item) => item.eventcode),
    ),
  );
  const [createRelationship, setCreateRelationship] = useState(true);
  const sportarten = selectionListChoices(selectionLists.sports, form.sportartId);

  useEffect(() => {
    detailWorkspace.accept(event, personen, kunden);
  }, [detailWorkspace, event, personen, kunden]);
  useEffect(() => {
    void detailWorkspace.refreshOutlookPlan();
  }, [event.id, event.start, event.outlookOrdner, detailWorkspace]);
  const vergangen = event.ende < heuteIso();
  const outlookVorschlag = detail.outlookPlan?.path ?? form.outlookOrdner ?? "";
  const outlookExistence = detail.outlookPlan?.existence ?? "UNKNOWN";
  const quartalsAbweichung = detail.outlookPlan?.drifted ?? false;
  const jahresSite = settings.jahresSites.find((s) => s.jahr === jahr(form.start));
  const folders = resolveEventFolderNavigation(form, settings);

  function set<K extends keyof T2WEvent>(key: K, wert: T2WEvent[K]) {
    detailWorkspace.update(key, wert);
  }

  async function speichern() {
    const result = await detailWorkspace.save(neuLaden);
    if (result.kind === "saved") toast.success("Änderungen gespeichert.");
    else if (result.kind === "conflict")
      toast.error("Das Event wurde zwischenzeitlich geändert. Bitte neu laden.");
    else if (result.error.message === "EVENT_START_REQUIRED")
      toast.error("Das Startdatum ist verpflichtend.");
    else toast.error("Änderungen konnten nicht gespeichert werden.");
  }

  async function outlookSynchronisieren() {
    const result = await detailWorkspace.syncOutlook();
    if (result.kind === "synced") toast.success("Outlook-Ordner synchronisiert.");
    else toast.error("Outlook-Ordner konnte nicht synchronisiert werden.");
  }
  async function time2winSynchronisieren() {
    const result = await detailWorkspace.syncTime2win();
    if (result.kind === "synced")
      toast.success(detail.time2winSyncMessage ?? "TIME2WIN-Teilnehmer synchronisiert.");
    else toast.error(detail.time2winSyncMessage ?? "TIME2WIN-Synchronisierung fehlgeschlagen.");
  }
  async function kommunikationSynchronisieren() {
    const result = await detailWorkspace.syncCommunication();
    if (result.kind === "synced") toast.success("Outlook-Nachrichten synchronisiert.");
    else toast.error("Outlook-Nachrichten konnten nicht synchronisiert werden.");
  }
  async function copyEvent() {
    try {
      const copied = await kopiereEvent(event.id, {
        name: copyName,
        eventcode: copyCode,
        start: copyStart,
        ende: copyEnde,
        createRelationship,
        version: event.version,
      });
      toast.success("Event kopiert.");
      setCopyDialog(false);
      window.location.assign(`/events/${copied.eventcode}`);
    } catch {
      toast.error("Event konnte nicht kopiert werden. Der Eventcode muss eindeutig sein.");
    }
  }
  const seriesEvents = form.seriesId
    ? events
        .filter((item) => item.seriesId === form.seriesId)
        .sort((a, b) => a.start.localeCompare(b.start))
    : [];
  const seriesIndex = seriesEvents.findIndex((item) => item.id === event.id);
  const previousEvent = seriesEvents[seriesIndex - 1];
  const nextEvent = seriesEvents[seriesIndex + 1];

  async function addEventContact(personId: string, role: string) {
    await detailWorkspace.addEventContact(personId, role);
  }
  async function addContact() {
    if (!detail.contactId) return;
    await detailWorkspace.addSelectedContact();
    toast.success("Kontaktrolle gespeichert.");
  }
  async function updateContactRole(contact: T2WEvent["kontakte"][number], role: string) {
    await detailWorkspace.updateContactRole(contact, role);
    toast.success("Eventrolle gespeichert.");
  }
  async function addTask() {
    if (!detail.newTask.trim()) return;
    await detailWorkspace.addTask();
    toast.success("Aufgabe angelegt.");
  }
  async function addFile() {
    if (!detail.newFile.trim()) return;
    await detailWorkspace.addFile();
    toast.success("Dateiverknüpfung gespeichert.");
  }
  async function addActivity() {
    if (!detail.newActivity.trim()) return;
    await detailWorkspace.addActivity();
    toast.success("Aktivität angelegt.");
  }

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/">
          <ArrowLeft className="size-4" />
          Zurück zur Eventliste
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-border bg-surface p-5">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{event.name}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="font-mono text-xs">{event.eventcode}</span>
            <span>·</span>
            <span>{event.veranstalter}</span>
            <span>·</span>
            <span>{formatZeitraum(event.start, event.ende)}</span>
            {form.seriesId && (
              <nav
                aria-label="Eventserie"
                data-testid="event-series-navigation"
                className="flex flex-wrap items-center gap-2"
              >
                <span>·</span>
                <span>Eventserie:</span>
                {previousEvent ? (
                  <Link
                    className="underline"
                    to="/events/$eventcode"
                    params={{ eventcode: previousEvent.eventcode }}
                  >
                    ← {previousEvent.name}
                  </Link>
                ) : (
                  <span>Kein vorheriges Event</span>
                )}
                {nextEvent ? (
                  <Link
                    className="underline"
                    to="/events/$eventcode"
                    params={{ eventcode: nextEvent.eventcode }}
                  >
                    {nextEvent.name} →
                  </Link>
                ) : (
                  <span>Kein nächstes Event</span>
                )}
              </nav>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <StatusBadge status={form.status} />
            {vergangen && (
              <span className="rounded bg-secondary px-2 py-1 text-xs text-muted-foreground">
                Vergangenes Event – weiterhin bearbeitbar
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCopyDialog(true)}>
            Event kopieren
          </Button>
          <Button onClick={speichern}>Änderungen speichern</Button>
        </div>
      </div>

      {quartalsAbweichung && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-accent px-4 py-3">
          <p className="text-sm text-accent-foreground">
            Quartalswechsel erkannt: Der Outlook-Ordner liegt nicht in {detail.outlookPlan?.quarter}
            . Vorschlag: <span className="font-mono">{outlookVorschlag}</span>. SharePoint bleibt
            unverändert.
          </p>
          <Button variant="outline" size="sm" onClick={() => setQuartalsDialog(true)}>
            <FolderSync className="size-4" />
            Verschiebung prüfen
          </Button>
        </div>
      )}

      <Tabs defaultValue="stammdaten">
        <TabsList className="flex-wrap">
          <TabsTrigger value="stammdaten">STAMMDATEN</TabsTrigger>
          <TabsTrigger value="time2win">TIME2WIN</TabsTrigger>
          <TabsTrigger value="finanz">FINANZ</TabsTrigger>
          <TabsTrigger value="kontakte">KONTAKTE</TabsTrigger>
          <TabsTrigger value="aufgaben">AUFGABEN</TabsTrigger>
          <TabsTrigger value="dateien">DATEIEN</TabsTrigger>
          <TabsTrigger value="kommunikation">KOMMUNIKATION</TabsTrigger>
        </TabsList>

        <TabsContent value="stammdaten" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("detail.basicData")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="d-name">Eventname</Label>
                <Input
                  id="d-name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="d-code">
                  Eventcode{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    (unveränderlich)
                  </span>
                </Label>
                <Input
                  id="d-code"
                  value={form.eventcode}
                  readOnly
                  disabled
                  className="mt-1.5 font-mono"
                />
              </div>
              <div>
                <Label htmlFor="d-ver">Veranstalter</Label>
                <Select
                  value={form.veranstalterId}
                  onValueChange={(id) => {
                    const customer = kunden.find((item) => item.id === id);
                    if (customer) {
                      set("veranstalterId", customer.id);
                      set("veranstalter", customer.name);
                    }
                  }}
                >
                  <SelectTrigger aria-label="Veranstalter aus Stammdaten" className="mt-1.5">
                    <SelectValue placeholder="Kunde aus Stammdaten auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {kunden.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="d-start">Startdatum *</Label>
                <Input
                  id="d-start"
                  type="date"
                  value={form.start}
                  onChange={(e) => set("start", e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Sportart</Label>
                <Select value={form.sportartId} onValueChange={(id) => set("sportartId", id)}>
                  <SelectTrigger aria-label="Sportart" className="mt-1.5">
                    <SelectValue placeholder="Sportart auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {sportarten.map((sport) => (
                      <SelectItem key={sport.id} value={sport.id}>
                        {sport.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="d-ende">Enddatum</Label>
                <Input
                  id="d-ende"
                  type="date"
                  value={form.ende}
                  onChange={(e) => set("ende", e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="d-ort">Ort</Label>
                <Input
                  id="d-ort"
                  value={form.ort}
                  onChange={(e) => set("ort", e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="d-resp">Hauptverantwortlich</Label>
                <Input
                  id="d-resp"
                  value={form.verantwortlicher}
                  onChange={(e) => set("verantwortlicher", e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="d-forecast">Teilnehmerprognose</Label>
                <Input
                  id="d-forecast"
                  type="number"
                  min="0"
                  value={form.teilnehmerwerte?.prognose ?? form.teilnehmer}
                  onChange={(e) =>
                    set("teilnehmerwerte", {
                      ...(form.teilnehmerwerte ?? {
                        aktuell: null,
                        aktuellQuelle: null,
                        aktuellSynchronisiertAm: null,
                      }),
                      prognose: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v as EventStatus)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_ORDER.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 sm:col-span-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Archiviert</p>
                  <p className="text-xs text-muted-foreground">
                    Archivierte Events erscheinen nur im Archivfilter.
                  </p>
                </div>
                <Switch checked={form.archiviert} onCheckedChange={(v) => set("archiviert", v)} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="d-notizen">Notizen</Label>
                <Textarea
                  id="d-notizen"
                  rows={4}
                  value={form.notizen}
                  onChange={(e) => set("notizen", e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ordnerverknüpfungen</CardTitle>
              <CardDescription>
                Manuelle Verknüpfung – Outlook nach Quartal, SharePoint direkt im Jahresbereich.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="d-outlook">Outlook-Ordner</Label>
                <Input
                  id="d-outlook"
                  value={form.outlookOrdner ?? ""}
                  placeholder={outlookVorschlag}
                  onChange={(e) => set("outlookOrdner", e.target.value || null)}
                  className="mt-1.5 font-mono text-xs"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1.5"
                  onClick={() => set("outlookOrdner", outlookVorschlag)}
                >
                  <Link2 className="size-4" />
                  Vorschlag übernehmen
                </Button>
                <div
                  aria-label="Outlook-Ordnerstatus"
                  className="mt-2 flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm"
                >
                  {outlookExistence === "EXISTS" ? (
                    <CheckCircle2
                      className="mt-0.5 size-4 shrink-0 text-status-zugesagt"
                      aria-hidden="true"
                    />
                  ) : outlookExistence === "MISSING" ? (
                    <FolderPlus
                      className="mt-0.5 size-4 shrink-0 text-risk-beobachten"
                      aria-hidden="true"
                    />
                  ) : (
                    <HelpCircle
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                  )}
                  <span>
                    {outlookExistence === "EXISTS"
                      ? "Ordner vorhanden – der bestehende Outlook-Ordner wird verwendet."
                      : outlookExistence === "MISSING"
                        ? "Ordner nicht vorhanden – er wird bei der Synchronisation neu erstellt."
                        : "Ordnerstatus konnte noch nicht geprüft werden."}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <FolderLink
                    label="Outlook"
                    href={folders.outlook.href}
                    available={folders.outlook.available}
                  >
                    {form.outlookOrdner}
                  </FolderLink>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={detail.outlookSyncing || !settings.outlookMailbox}
                    onClick={() => void outlookSynchronisieren()}
                  >
                    {detail.outlookSyncing ? "Synchronisiere …" : "Outlook-Ordner synchronisieren"}
                  </Button>
                  {detail.outlookSyncMessage && (
                    <span role="status">{detail.outlookSyncMessage}</span>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Graph-Sync:{" "}
                  {form.outlookFolderSyncStatus === "SUCCESS"
                    ? `erfolgreich${form.outlookFolderLastSuccessAt ? ` am ${formatDatum(form.outlookFolderLastSuccessAt.slice(0, 10))}` : ""}`
                    : form.outlookFolderSyncStatus === "ERROR"
                      ? `Fehler${form.outlookFolderLastError ? `: ${form.outlookFolderLastError}` : ""}`
                      : form.outlookFolderSyncStatus === "SYNCING"
                        ? "läuft …"
                        : "noch nicht ausgeführt"}
                </p>
                <Label htmlFor="d-outlook-url" className="mt-3 block">
                  Outlook-Web-Link
                </Label>
                <Input
                  id="d-outlook-url"
                  type="url"
                  value={form.outlookWebUrl ?? ""}
                  placeholder="https://outlook.office.com/mail/..."
                  onChange={(e) => set("outlookWebUrl", e.target.value || null)}
                  className="mt-1.5 text-xs"
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Öffnet den konkreten Ordner direkt in Outlook Web.
                </p>
              </div>
              <div>
                <Label htmlFor="d-sp">SharePoint-Ordner</Label>
                <Input
                  id="d-sp"
                  value={form.sharepointOrdner ?? ""}
                  placeholder={`Events ${jahr(form.start)}/${event.eventcode}`}
                  onChange={(e) => set("sharepointOrdner", e.target.value || null)}
                  className="mt-1.5 font-mono text-xs"
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Jahres-Site:{" "}
                  {jahresSite ? jahresSite.url : "in Einstellungen noch nicht hinterlegt"}
                </p>
                <div className="mt-2 text-xs">
                  <FolderLink
                    label="SharePoint"
                    href={folders.sharepoint.href}
                    available={folders.sharepoint.available}
                  >
                    {form.sharepointOrdner}
                  </FolderLink>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time2win">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">TIME2WIN</CardTitle>
              <CardDescription>
                Lokale Prognose bleibt vom synchronisierten Teilnehmerstand getrennt.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="d-t2w">Event Id</Label>
                <Input
                  id="d-t2w"
                  type="number"
                  value={form.t2wEventId ?? ""}
                  onChange={(e) =>
                    set("t2wEventId", e.target.value === "" ? null : Number(e.target.value))
                  }
                  className="mt-1.5"
                />
              </div>
              <div className="text-sm">
                <p>
                  Verknüpftes Event: <strong>{form.time2winSnapshot?.name ?? "—"}</strong>
                </p>
                <p>TIME2WIN-Sportart: {form.time2winSnapshot?.sportName ?? "—"}</p>
                <p>
                  Gemeldete TN: <strong>{form.teilnehmerwerte?.aktuell ?? "—"}</strong>
                </p>
                <p>
                  Letzter Sync:{" "}
                  {form.time2winLastSuccessAt
                    ? formatDatum(form.time2winLastSuccessAt.slice(0, 10))
                    : "—"}
                </p>
                <p>Status: {form.time2winSyncStatus ?? "NEVER"}</p>
                {form.time2winLastError && (
                  <p className="text-destructive">{form.time2winLastError}</p>
                )}
                <Button
                  type="button"
                  className="mt-3"
                  disabled={!form.t2wEventId || detail.time2winSyncing}
                  onClick={() => void time2winSynchronisieren()}
                >
                  {detail.time2winSyncing ? "Synchronisiere …" : "Jetzt synchronisieren"}
                </Button>
              </div>
              <div className="sm:col-span-2">
                <h3 className="text-sm font-medium text-foreground">Teilnehmer nach Bewerb</h3>
                {form.time2winSnapshot?.races.length ? (
                  <Table
                    className="mt-2 min-w-[22rem]"
                    aria-label="TIME2WIN Teilnehmer nach Bewerb"
                  >
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bewerb</TableHead>
                        <TableHead className="text-right">Gemeldete TN</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {form.time2winSnapshot.races.map((race) => (
                        <TableRow key={race.id}>
                          <TableCell className="font-medium">{race.name}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {race.participantCount ?? "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell>Gesamt</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {form.teilnehmerwerte?.aktuell ?? "—"}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Noch keine TIME2WIN-Bewerbe geladen.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finanz">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Finanz</CardTitle>
              <CardDescription>
                Standardmäßig ist der Veranstalter als Auszahlungs- und Rechnungsempfänger
                hinterlegt.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label>Auszahlungsempfänger</Label>
                <Select
                  value={detail.payoutRecipientId ?? undefined}
                  onValueChange={(id) => set("auszahlungsempfaengerId", id)}
                >
                  <SelectTrigger aria-label="Auszahlungsempfänger" className="mt-1.5">
                    <SelectValue placeholder="Veranstalter" />
                  </SelectTrigger>
                  <SelectContent>
                    {kunden.map((kunde) => (
                      <SelectItem key={kunde.id} value={kunde.id}>
                        {kunde.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {detail.payoutRecipient && (
                  <div aria-label="Stammdaten Auszahlungsempfänger" className="mt-3">
                    <RecipientMasterData recipient={detail.payoutRecipient} />
                  </div>
                )}
              </div>
              <div>
                <Label>Rechnungsempfänger</Label>
                <p className="mt-1 text-xs text-muted-foreground">Mehrere Empfänger möglich.</p>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      aria-label="Rechnungsempfänger auswählen"
                      variant="outline"
                      className="mt-2 w-full justify-start font-normal"
                    >
                      {detail.invoiceRecipients.length
                        ? detail.invoiceRecipients.map((kunde) => kunde.name).join(", ")
                        : "Rechnungsempfänger auswählen"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-[min(28rem,calc(100vw-2rem))] p-2">
                    <Input
                      aria-label="Rechnungsempfänger suchen"
                      placeholder="Rechnungsempfänger suchen …"
                      value={detail.invoiceRecipientSearch}
                      onChange={(e) =>
                        detailWorkspace.setInput("invoiceRecipientSearch", e.target.value)
                      }
                    />
                    <div className="mt-2 max-h-56 space-y-1 overflow-y-auto">
                      {detail.visibleInvoiceRecipients.length ? (
                        detail.visibleInvoiceRecipients.map((kunde) => (
                          <label
                            key={kunde.id}
                            className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
                          >
                            <Checkbox
                              checked={detail.invoiceRecipientIds.includes(kunde.id)}
                              onCheckedChange={() =>
                                detailWorkspace.toggleInvoiceRecipient(kunde.id)
                              }
                            />
                            {kunde.name}
                          </label>
                        ))
                      ) : (
                        <p className="px-2 py-3 text-sm text-muted-foreground">Keine Treffer</p>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
                {detail.invoiceRecipients.length > 0 && (
                  <div aria-label="Stammdaten Rechnungsempfänger" className="mt-3 space-y-3">
                    {detail.invoiceRecipients.map((kunde) => (
                      <RecipientMasterData key={kunde.id} recipient={kunde} />
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kontakte">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("nav.contacts")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <section>
                <h3 className="font-medium text-foreground">Kontakte des Veranstalters</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Stammdatenkontakte des ausgewählten Veranstalters.
                </p>
                {!event.veranstalterId ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Kein Veranstalter ausgewählt.
                  </p>
                ) : detail.organizerContacts.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Für diesen Veranstalter sind keine Kontakte hinterlegt.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {detail.organizerContacts.map((person) => {
                      const alreadyAdded = form.kontakte.some((item) => item.id === person.id);
                      return (
                        <div
                          key={person.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"
                        >
                          <div>
                            <p className="font-medium text-foreground">
                              {person.vorname} {person.nachname}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {person.email} ·{" "}
                              {person.telefonBeruflich || person.telefonPrivat || "—"}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              void addEventContact(person.id, "Kontakt").then(() =>
                                toast.success("Als Eventkontakt übernommen."),
                              )
                            }
                            disabled={alreadyAdded}
                          >
                            {alreadyAdded ? "Bereits Eventkontakt" : "Als Eventkontakt übernehmen"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
              <section className="border-t border-border pt-5">
                <h3 className="font-medium text-foreground">Eventkontakte & Rollen</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Explizit für dieses Event zugeordnete Kontakte.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-56 justify-start font-normal"
                        aria-label="Kontakt auswählen"
                      >
                        {detail.contactId
                          ? (() => {
                              const person = personen.find((item) => item.id === detail.contactId);
                              return person
                                ? `${person.vorname} ${person.nachname}`
                                : "Kontakt auswählen";
                            })()
                          : "Kontakt auswählen"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-[min(28rem,calc(100vw-2rem))] p-2">
                      <Input
                        aria-label="Kontakt suchen"
                        placeholder="Kontakt suchen …"
                        value={detail.contactSearch}
                        onChange={(e) => detailWorkspace.setInput("contactSearch", e.target.value)}
                      />
                      <div className="mt-2 max-h-56 space-y-1 overflow-y-auto">
                        {detail.visibleContacts.length ? (
                          detail.visibleContacts.map((person) => (
                            <button
                              type="button"
                              key={person.id}
                              className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                              onClick={() => {
                                detailWorkspace.selectContact(person.id);
                              }}
                            >
                              {person.vorname} {person.nachname}
                              <span className="ml-2 text-muted-foreground">{person.email}</span>
                            </button>
                          ))
                        ) : (
                          <p className="px-2 py-3 text-sm text-muted-foreground">Keine Treffer</p>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Select
                    value={detail.contactRole}
                    onValueChange={(value) => detailWorkspace.setInput("contactRole", value)}
                  >
                    <SelectTrigger aria-label="Eventrolle" className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {eventContactRoleChoices(selectionLists.eventRoles, detail.contactRole).map(
                        (role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  <Button onClick={() => void addContact()} disabled={!detail.contactId}>
                    Hinzufügen
                  </Button>
                </div>
              </section>
              {form.kontakte.length === 0 && (
                <p className="text-sm text-muted-foreground">Noch keine Kontakte hinterlegt.</p>
              )}
              {form.kontakte.length > 0 && (
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-medium">Kontakt</th>
                        <th className="px-3 py-2 font-medium">Rolle</th>
                        <th className="px-3 py-2 font-medium">E-Mail</th>
                        <th className="px-3 py-2 font-medium">Telefon</th>
                        <th className="px-3 py-2">
                          <span className="sr-only">Aktion</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {form.kontakte.map((k) => (
                        <tr key={k.id}>
                          <td className="whitespace-nowrap px-3 py-2 font-medium text-foreground">
                            {k.name}
                          </td>
                          <td className="min-w-48 px-3 py-2">
                            <Select
                              value={k.rolle}
                              onValueChange={(role) => void updateContactRole(k, role)}
                            >
                              <SelectTrigger
                                aria-label={`Eventrolle für ${k.name}`}
                                className="min-h-11 sm:min-h-9"
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {eventContactRoleChoices(selectionLists.eventRoles, k.rolle).map(
                                  (role) => (
                                    <SelectItem key={role} value={role}>
                                      {role}
                                    </SelectItem>
                                  ),
                                )}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                            {k.email || "—"}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                            {k.telefon || "—"}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                void detailWorkspace
                                  .removeContact(k.id, k.rolle)
                                  .catch(() =>
                                    toast.error("Kontaktrolle konnte nicht entfernt werden."),
                                  )
                              }
                            >
                              Entfernen
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aufgaben">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("nav.tasks")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-2">
                <Input
                  aria-label="Neue Aufgabe"
                  value={detail.newTask}
                  onChange={(e) => detailWorkspace.setInput("newTask", e.target.value)}
                />
                <Button onClick={() => void addTask()}>Aufgabe anlegen</Button>
              </div>
              {form.aufgaben.length === 0 && (
                <p className="text-sm text-muted-foreground">Noch keine Aufgaben angelegt.</p>
              )}
              {form.aufgaben.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 rounded-md border border-border px-3 py-2"
                >
                  <Checkbox
                    checked={a.erledigt}
                    onCheckedChange={(v) =>
                      void detailWorkspace
                        .updateTask(a.id, !!v)
                        .catch(() => toast.error("Aufgabe konnte nicht gespeichert werden."))
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={
                        a.erledigt
                          ? "text-sm text-muted-foreground line-through"
                          : "text-sm font-medium text-foreground"
                      }
                    >
                      {a.titel}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      fällig {formatDatum(a.faellig)} · {a.verantwortlich}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dateien">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dateien</CardTitle>
              <CardDescription>Ansicht des verknüpften SharePoint-Ordners.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-2">
                <Input
                  aria-label="Dateiverknüpfung"
                  value={detail.newFile}
                  onChange={(e) => detailWorkspace.setInput("newFile", e.target.value)}
                  placeholder="Dateiname oder SharePoint-Link"
                />
                <Button onClick={() => void addFile()}>Verknüpfen</Button>
              </div>
              {form.dateien.length === 0 && (
                <p className="text-sm text-muted-foreground">Keine Dateien verknüpft.</p>
              )}
              {form.dateien.map((f) => (
                <div
                  key={f.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                >
                  <span className="text-sm font-medium text-foreground">{f.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {f.groesse} · {formatDatum(f.aktualisiert)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kommunikation">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kommunikation</CardTitle>
              <CardDescription>
                Outlook-Nachrichten aus dem Eventordner und manuelle Aktivitäten in einer Timeline.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                  variant="outline"
                  onClick={() => void kommunikationSynchronisieren()}
                  disabled={detail.communicationSyncing || !form.outlookFolderId}
                >
                  <FolderSync className="size-4" />
                  {detail.communicationSyncing
                    ? "Synchronisiere …"
                    : "Outlook-Nachrichten synchronisieren"}
                </Button>
                {form.outlookMessageLastSuccessAt && (
                  <span className="text-xs text-muted-foreground">
                    Zuletzt synchronisiert: {formatDatum(form.outlookMessageLastSuccessAt)}
                  </span>
                )}
              </div>
              {detail.communicationSyncMessage && (
                <p role="status" className="text-sm text-muted-foreground">
                  {detail.communicationSyncMessage}
                </p>
              )}
              {!form.outlookFolderId && (
                <p className="text-sm text-muted-foreground">
                  Zuerst den Outlook-Eventordner synchronisieren.
                </p>
              )}
              <div className="flex gap-2">
                <Input
                  aria-label="Neue Aktivität"
                  value={detail.newActivity}
                  onChange={(e) => detailWorkspace.setInput("newActivity", e.target.value)}
                  placeholder="Betreff der Notiz"
                />
                <Button onClick={() => void addActivity()}>Aktivität anlegen</Button>
              </div>
              {form.kommunikation.length === 0 && (
                <p className="text-sm text-muted-foreground">Noch keine Einträge.</p>
              )}
              {form.kommunikation.map((m) => {
                const Icon =
                  m.kanal === "E-Mail" ? Mail : m.kanal === "Telefon" ? Phone : StickyNote;
                return (
                  <div key={m.id} className="rounded-md border border-border p-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <Icon className="size-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">{m.betreff}</span>
                      <span className="text-xs text-muted-foreground">
                        {m.kanal} · {formatDatum(m.datum)}
                      </span>
                    </div>
                    {m.richtung && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {m.richtung === "INCOMING" ? "Eingehend" : "Ausgehend"} · {m.autor}
                      </p>
                    )}
                    <p className="mt-2 text-sm text-muted-foreground">{m.text}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {!m.richtung && m.autor && <span>{m.autor}</span>}
                      {m.hatAnlagen && <span>Anlagen vorhanden</span>}
                      {m.outlookWebUrl && (
                        <a
                          className="font-medium text-primary hover:underline"
                          href={m.outlookWebUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          In Outlook öffnen
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={copyDialog} onOpenChange={setCopyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Event kopieren</AlertDialogTitle>
            <AlertDialogDescription>
              Stammdaten, Empfänger und Kontaktrollen werden übernommen. Aufgaben, Dateien,
              Kommunikation und TIME2WIN-Daten bleiben beim Quell-Event.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="copy-name">Eventname</Label>
              <Input
                id="copy-name"
                value={copyName}
                onChange={(e) => {
                  setCopyName(e.target.value);
                  setCopyCode(
                    buildEventcode(
                      e.target.value,
                      copyStart,
                      events.map((item) => item.eventcode),
                    ),
                  );
                }}
              />
            </div>
            <div>
              <Label htmlFor="copy-start">Startdatum</Label>
              <Input
                id="copy-start"
                type="date"
                value={copyStart}
                onChange={(e) => {
                  setCopyStart(e.target.value);
                  setCopyCode(
                    buildEventcode(
                      copyName,
                      e.target.value,
                      events.map((item) => item.eventcode),
                    ),
                  );
                }}
              />
            </div>
            <div>
              <Label htmlFor="copy-ende">Enddatum</Label>
              <Input
                id="copy-ende"
                type="date"
                value={copyEnde}
                onChange={(e) => setCopyEnde(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="copy-code">Eventcode</Label>
              <Input
                id="copy-code"
                value={copyCode}
                onChange={(e) => setCopyCode(e.target.value)}
              />
            </div>
            <label className="sm:col-span-2 flex items-center gap-2 text-sm">
              <Checkbox
                checked={createRelationship}
                onCheckedChange={(checked) => setCreateRelationship(checked === true)}
              />
              Als Eventserie verknüpfen
            </label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void copyEvent();
              }}
            >
              Kopie speichern
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={quartalsDialog} onOpenChange={setQuartalsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Outlook-Ordner verschieben?</AlertDialogTitle>
            <AlertDialogDescription>
              Der Ordner {form.outlookOrdner} soll nach {outlookVorschlag} verschoben werden. Der
              SharePoint-Ordner bleibt unverändert im Jahresbereich.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                void detailWorkspace.confirmOutlookMove(outlookVorschlag).then((result) => {
                  if (result.kind === "saved") toast.success("Outlook-Verschiebung bestätigt.");
                  else toast.error("Outlook-Verschiebung konnte nicht gespeichert werden.");
                });
              }}
            >
              Verschiebung bestätigen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
