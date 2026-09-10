import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CornerDownRight,
  FolderPlus,
  FolderSync,
  HelpCircle,
  Link2,
  Mail,
  MessageSquare,
  Paperclip,
  PanelsTopLeft,
  Phone,
  Search,
  Rows3,
  StickyNote,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { apiUpdateEventSeries } from "@/lib/t2w/api";
import { useCrm } from "@/lib/crm/store";
import { eventContactRoleChoices, selectionListChoices } from "@/lib/t2w/selection-list-workspace";
import { useI18n } from "@/lib/i18n";
import { formatDatum, formatZeitraum, heuteIso } from "@/lib/t2w/format";
import { buildEventcode, copyDateSuggestion, jahr } from "@/lib/t2w/eventcode";
import { createEventDetailWorkspace } from "@/lib/t2w/event-detail-workspace";
import { projectCommunicationTimeline } from "@/lib/t2w/communication-timeline";
import { resolveEventFolderNavigation } from "@/lib/t2w/folder-navigation";
import { STATUS_LABEL, STATUS_ORDER, type EventStatus, type T2WEvent } from "@/lib/t2w/types";
import { personName, type Kunde } from "@/lib/crm/types";
import { HardwareWorkspace } from "@/components/t2w/HardwareWorkspace";
import { PayoutsPanel } from "@/components/t2w/PayoutsPanel";
import { ServiceBadge, SelectionBadge } from "@/components/t2w/ServiceBadge";
import { PageHeader } from "@/components/t2w/PageHeader";

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
        <dt className="text-xs text-muted-foreground">IBAN / BIC</dt>
        <dd>
          {recipient.iban || "—"}
          <span className="px-1.5 text-muted-foreground" aria-hidden="true">
            ·
          </span>
          {recipient.bic || "—"}
        </dd>
      </div>
    </dl>
  );
}

function formatCommunicationTime(value: string) {
  return new Intl.DateTimeFormat("de-AT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function communicationDate(value: string) {
  return new Intl.DateTimeFormat("de-AT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
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
  const {
    openEventSession,
    settings,
    selectionLists,
    events,
    kopiereEvent,
    loescheEvent,
    uebernehmeEvents,
  } = useT2W();
  const { personen, kunden, neuLaden } = useCrm();
  const { t } = useI18n();
  const [detailWorkspace] = useState(() =>
    createEventDetailWorkspace(
      openEventSession(event.id),
      {
        event,
        persons: personen,
        customers: kunden,
        events,
      },
      {
        copy: kopiereEvent,
        remove: loescheEvent,
        updateSeries: apiUpdateEventSeries,
        applyEvents: uebernehmeEvents,
      },
    ),
  );
  const detail = useSyncExternalStore(
    detailWorkspace.subscribe,
    detailWorkspace.snapshot,
    detailWorkspace.snapshot,
  );
  const { form } = detail;
  const [quartalsDialog, setQuartalsDialog] = useState(false);
  const [copyDialog, setCopyDialog] = useState(false);
  const [seriesDialog, setSeriesDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteAreaOpen, setDeleteAreaOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("stammdaten");
  const [saving, setSaving] = useState(false);
  const savedEventRef = useRef(event);
  const [seriesTargetEventId, setSeriesTargetEventId] = useState("");
  const [seriesSearch, setSeriesSearch] = useState("");
  const [seriesPickerOpen, setSeriesPickerOpen] = useState(false);
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
  const [communicationFilter, setCommunicationFilter] = useState<"all" | "email" | "activity">(
    "all",
  );
  const [communicationContactFilter, setCommunicationContactFilter] = useState("all");
  const [communicationSearch, setCommunicationSearch] = useState("");
  const [communicationView, setCommunicationView] = useState<"cards" | "conversation" | "compact">(
    "compact",
  );
  const [selectedCommunicationId, setSelectedCommunicationId] = useState<string | null>(null);
  const threadContextRef = useRef<HTMLElement | null>(null);
  const communicationTimelineRef = useRef<HTMLDivElement | null>(null);
  const [threadContextOffset, setThreadContextOffset] = useState(0);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(() => new Set());
  const sportarten = selectionListChoices(selectionLists.sports, form.sportartId);
  const services = selectionListChoices(selectionLists.services).filter(
    (service) => service.active || form.serviceIds?.includes(service.id),
  );
  const communicationTimeline = useMemo(
    () =>
      projectCommunicationTimeline({
        messages: form.kommunikation,
        eventContacts: form.kontakte,
        contacts: personen.map((person) => ({
          id: person.id,
          name: personName(person),
          email: person.email,
        })),
        mailbox: form.outlookMailbox ?? settings.outlookMailbox,
        criteria: {
          kind: communicationFilter,
          contactId: communicationContactFilter,
          search: communicationSearch,
          view: communicationView,
        },
      }),
    [
      communicationContactFilter,
      communicationFilter,
      communicationSearch,
      communicationView,
      form.kontakte,
      form.kommunikation,
      form.outlookMailbox,
      personen,
      settings.outlookMailbox,
    ],
  );
  const communicationGroups = communicationTimeline.groups;
  const selectedCommunication = useMemo(
    () =>
      communicationTimeline.visibleMessages.find(
        (message) => message.id === selectedCommunicationId,
      ) ?? communicationTimeline.visibleMessages[0],
    [communicationTimeline.visibleMessages, selectedCommunicationId],
  );
  const selectedThread = communicationTimeline.selectedThread(selectedCommunicationId);
  const selectCommunication = (messageId: string) => {
    setSelectedCommunicationId(messageId);
    requestAnimationFrame(() => {
      const selected = document.getElementById(`communication-${messageId}`);
      const first = communicationTimelineRef.current?.querySelector<HTMLElement>("article");
      if (selected && first) {
        setThreadContextOffset(
          Math.max(0, selected.getBoundingClientRect().top - first.getBoundingClientRect().top),
        );
      }
    });
  };

  useEffect(() => {
    detailWorkspace.accept(event, personen, kunden, events);
    savedEventRef.current = event;
  }, [detailWorkspace, event, personen, kunden, events]);
  useEffect(() => {
    void detailWorkspace.refreshOutlookPlan();
  }, [event.id, event.start, event.outlookOrdner, detailWorkspace]);
  const vergangen = event.ende < heuteIso();
  const outlookVorschlag = detail.outlookPlan?.path ?? form.outlookOrdner ?? "";
  const outlookExistence = detail.outlookPlan?.existence ?? "UNKNOWN";
  const quartalsAbweichung = detail.outlookPlan?.drifted ?? false;
  const jahresSite = settings.jahresSites.find((s) => s.jahr === jahr(form.start));
  const folders = resolveEventFolderNavigation(form, settings);
  const isDirty = JSON.stringify(form) !== JSON.stringify(savedEventRef.current);

  function set<K extends keyof T2WEvent>(key: K, wert: T2WEvent[K]) {
    detailWorkspace.update(key, wert);
  }

  async function speichern() {
    setSaving(true);
    try {
      const outcome = await detailWorkspace.execute("save", neuLaden);
      if (outcome.kind === "success") {
        savedEventRef.current = detailWorkspace.snapshot().form;
        toast.success(outcome.message);
      } else toast.error(outcome.message);
    } finally {
      setSaving(false);
    }
  }

  async function outlookSynchronisieren() {
    const outcome = await detailWorkspace.execute("sync-outlook");
    if (outcome.kind === "success") {
      toast.success(outcome.message);
    } else {
      toast.error(outcome.message);
    }
  }
  async function time2winSynchronisieren() {
    const outcome = await detailWorkspace.execute("sync-time2win");
    if (outcome.kind === "success") {
      toast.success(outcome.message);
    } else {
      toast.error(outcome.message);
    }
  }
  async function kommunikationSynchronisieren() {
    const outcome = await detailWorkspace.execute("sync-communication");
    if (outcome.kind === "success") {
      toast.success(outcome.message);
    } else {
      toast.error(outcome.message);
    }
  }
  async function eventLoeschen() {
    try {
      await detailWorkspace.remove();
      toast.success("Event gelöscht.");
      window.location.assign("/");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Event konnte nicht gelöscht werden. Bitte neu laden.",
      );
    }
  }
  async function copyEvent() {
    try {
      const copied = await detailWorkspace.copy({
        name: copyName,
        eventcode: copyCode,
        start: copyStart,
        ende: copyEnde,
        createRelationship,
      });
      toast.success("Event kopiert.");
      setCopyDialog(false);
      window.location.assign(`/events/${copied.eventcode}`);
    } catch {
      toast.error("Event konnte nicht kopiert werden. Der Eventcode muss eindeutig sein.");
    }
  }
  const {
    seriesCandidates,
    seriesEvents,
    previousSeriesEvent: previousEvent,
    nextSeriesEvent: nextEvent,
  } = detail;
  const visibleSeriesCandidates = seriesCandidates.filter((item) => {
    const query = seriesSearch.trim().toLocaleLowerCase();
    if (!query) return true;
    return `${item.name} ${item.eventcode} ${formatDatum(item.start)}`
      .toLocaleLowerCase()
      .includes(query);
  });
  async function updateSeries(targetEventId?: string) {
    try {
      await detailWorkspace.updateSeries(targetEventId);
      setSeriesDialog(false);
      setSeriesTargetEventId("");
      toast.success(targetEventId ? "Eventserie gespeichert." : "Event aus der Serie entfernt.");
    } catch {
      toast.error("Eventserie konnte nicht gespeichert werden. Bitte neu laden.");
    }
  }

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
      <PageHeader
        krumen={[
          { label: "TIME2WIN", to: "/" },
          { label: "Veranstaltungen", to: "/veranstaltungen" },
        ]}
        titel={event.name}
        beschreibung={event.eventcode}
      />

      <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-border bg-surface p-5">
        <div className="space-y-2">
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
          <Button variant="outline" onClick={() => setSeriesDialog(true)}>
            Eventserie verwalten
          </Button>
          <Button variant="outline" onClick={() => setCopyDialog(true)}>
            Event kopieren
          </Button>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {isDirty && (
              <span className="text-xs text-muted-foreground" aria-live="polite">
                Ungespeicherte Änderungen
              </span>
            )}
            <Button disabled={!isDirty || saving} onClick={speichern}>
              {saving ? "Wird gespeichert …" : "Änderungen speichern"}
            </Button>
          </div>
        </div>
      </div>

      {quartalsAbweichung && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-accent px-4 py-3">
          <p className="text-sm text-accent-foreground">
            Der Outlook-Ordner liegt im falschen Quartal. Prüfen Sie den vorgeschlagenen Zielordner;
            SharePoint bleibt unverändert.
          </p>
          <Button variant="outline" size="sm" onClick={() => setQuartalsDialog(true)}>
            <FolderSync className="size-4" />
            Vorschlag prüfen
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="sticky top-0 z-20 flex max-w-full items-center gap-1">
          <TabsList className="min-w-0 max-w-full flex-1 gap-2 overflow-x-auto whitespace-nowrap">
            <TabsTrigger value="stammdaten">STAMMDATEN</TabsTrigger>
            <TabsTrigger value="time2win">TIME2WIN</TabsTrigger>
            <TabsTrigger value="finanz">FINANZ</TabsTrigger>
            <TabsTrigger value="kontakte">KONTAKTE</TabsTrigger>
            <TabsTrigger
              id="event-tab-aufgaben"
              className="sr-only md:not-sr-only md:inline-flex"
              value="aufgaben"
            >
              AUFGABEN
            </TabsTrigger>
            <TabsTrigger
              id="event-tab-dateien"
              className="sr-only md:not-sr-only md:inline-flex"
              value="dateien"
            >
              DATEIEN
            </TabsTrigger>
            <TabsTrigger
              id="event-tab-kommunikation"
              className="sr-only md:not-sr-only md:inline-flex"
              value="kommunikation"
            >
              KOMMUNIKATION
            </TabsTrigger>
            <TabsTrigger
              id="event-tab-hardware"
              className="sr-only md:not-sr-only md:inline-flex"
              value="hardware"
            >
              HARDWARE
            </TabsTrigger>
          </TabsList>
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" aria-label="Weitere Eventbereiche">
                  Mehr <ChevronDown className="size-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {[
                  ["aufgaben", "AUFGABEN"],
                  ["dateien", "DATEIEN"],
                  ["kommunikation", "KOMMUNIKATION"],
                  ["hardware", "HARDWARE"],
                ].map(([value, label]) => (
                  <DropdownMenuItem key={value} asChild>
                    <button
                      type="button"
                      onPointerDown={() => {
                        setActiveTab(value);
                        document.getElementById(`event-tab-${value}`)?.click();
                      }}
                      onClick={() => setActiveTab(value)}
                    >
                      {label}
                    </button>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <TabsContent value="stammdaten" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("detail.basicData")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-1.5 lg:grid-cols-[9rem_minmax(0,1fr)] lg:items-start lg:gap-3">
                <Label htmlFor="d-notizen">Notizen</Label>
                <Textarea
                  id="d-notizen"
                  rows={4}
                  value={form.notizen}
                  onChange={(e) => set("notizen", e.target.value)}
                />
              </div>
              <div className="grid gap-1.5 lg:grid-cols-[9rem_minmax(0,1fr)_minmax(15rem,auto)] lg:items-center lg:gap-3">
                <Label htmlFor="d-name">Eventname</Label>
                <Input
                  id="d-name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                />
                <div
                  data-testid="event-archive-toggle"
                  className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
                >
                  <p className="text-sm font-medium text-foreground">Archiviert</p>
                  <Switch
                    aria-label="Event archivieren"
                    checked={form.archiviert}
                    onCheckedChange={(v) => set("archiviert", v)}
                  />
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
                <section aria-labelledby="event-identity-period" className="space-y-3">
                  <h3
                    id="event-identity-period"
                    className="border-b border-border pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    Identität &amp; Zeitraum
                  </h3>
                  <div className="grid gap-1.5 lg:grid-cols-[9rem_minmax(0,1fr)] lg:items-center lg:gap-3">
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
                      className="font-mono"
                    />
                  </div>
                  <div className="grid gap-1.5 lg:grid-cols-[9rem_minmax(0,1fr)] lg:items-center lg:gap-3">
                    <Label htmlFor="d-start">Startdatum *</Label>
                    <Input
                      id="d-start"
                      type="date"
                      value={form.start}
                      onChange={(e) => set("start", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1.5 lg:grid-cols-[9rem_minmax(0,1fr)] lg:items-center lg:gap-3">
                    <Label htmlFor="d-ende">Enddatum</Label>
                    <Input
                      id="d-ende"
                      type="date"
                      value={form.ende}
                      onChange={(e) => set("ende", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1.5 lg:grid-cols-[9rem_minmax(0,1fr)] lg:items-center lg:gap-3">
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
                    />
                  </div>
                </section>

                <section aria-labelledby="event-organization" className="space-y-3">
                  <h3
                    id="event-organization"
                    className="border-b border-border pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    Organisation &amp; Einordnung
                  </h3>
                  <div className="grid gap-1.5 lg:grid-cols-[9rem_minmax(0,1fr)] lg:items-center lg:gap-3">
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
                      <SelectTrigger aria-label="Veranstalter aus Stammdaten">
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
                  <div className="grid gap-1.5 lg:grid-cols-[9rem_minmax(0,1fr)] lg:items-center lg:gap-3">
                    <Label>Sportart</Label>
                    <Select value={form.sportartId} onValueChange={(id) => set("sportartId", id)}>
                      <SelectTrigger aria-label="Sportart">
                        <SelectValue placeholder="Sportart auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {sportarten.map((sport) => (
                          <SelectItem key={sport.id} value={sport.id}>
                            <SelectionBadge {...sport} />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5 lg:grid-cols-[9rem_minmax(0,1fr)] lg:items-center lg:gap-3">
                    <Label htmlFor="d-ort">Ort</Label>
                    <Input
                      id="d-ort"
                      value={form.ort}
                      onChange={(e) => set("ort", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1.5 lg:grid-cols-[9rem_minmax(0,1fr)] lg:items-center lg:gap-3">
                    <Label htmlFor="d-resp">Hauptverantwortlich</Label>
                    <Input
                      id="d-resp"
                      value={form.verantwortlicher}
                      onChange={(e) => set("verantwortlicher", e.target.value)}
                    />
                  </div>
                </section>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 sm:gap-6">
                <div className="grid gap-1.5 lg:grid-cols-[9rem_minmax(0,1fr)] lg:items-center lg:gap-3">
                  <Label>Services</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        aria-label="Services auswählen"
                        variant="outline"
                        className="h-auto min-h-9 w-full justify-start font-normal"
                      >
                        {form.services?.length ? (
                          <span className="flex flex-wrap gap-1.5">
                            {form.serviceIds?.map((serviceId) => {
                              const service = services.find((item) => item.id === serviceId);
                              return service ? (
                                <ServiceBadge key={service.id} {...service} />
                              ) : null;
                            })}
                          </span>
                        ) : (
                          "Services auswählen"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      className="max-h-[min(24rem,calc(100vh-2rem))] w-[min(28rem,calc(100vw-2rem))] overflow-y-auto p-2"
                    >
                      <div className="space-y-1" role="group" aria-label="Services">
                        {services.map((service) => {
                          const selected = form.serviceIds?.includes(service.id) ?? false;
                          return (
                            <label
                              key={service.id}
                              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                            >
                              <Checkbox
                                checked={selected}
                                onCheckedChange={(checked) => {
                                  const current = form.serviceIds ?? [];
                                  const serviceIds = checked
                                    ? [...current, service.id]
                                    : current.filter((id) => id !== service.id);
                                  set("serviceIds", serviceIds);
                                  set(
                                    "services",
                                    services
                                      .filter((item) => serviceIds.includes(item.id))
                                      .map((item) => item.name),
                                  );
                                }}
                              />
                              <ServiceBadge {...service} />
                            </label>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-1.5 lg:grid-cols-[9rem_minmax(0,1fr)] lg:items-center lg:gap-3">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => set("status", v as EventStatus)}
                  >
                    <SelectTrigger aria-label="Status">
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
                  <FolderLink destination={folders.find(({ id }) => id === "outlook")!} />
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
                  <FolderLink destination={folders.find(({ id }) => id === "sharepoint")!} />
                </div>
              </div>
            </CardContent>
          </Card>
          <Collapsible open={deleteAreaOpen} onOpenChange={setDeleteAreaOpen}>
            <section
              className="rounded-lg border border-destructive/30 bg-destructive/5 p-5"
              aria-labelledby="event-delete-heading"
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between px-0 text-destructive hover:bg-transparent"
                >
                  <span id="event-delete-heading" className="font-semibold">
                    Gefahrenbereich
                  </span>
                  {deleteAreaOpen ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <p className="mt-2 text-sm text-muted-foreground">
                  Das Event und die zugehörigen Daten werden dauerhaft gelöscht. Dieser Vorgang kann
                  nicht rückgängig gemacht werden.
                </p>
                <Button
                  variant="destructive"
                  className="mt-4"
                  onClick={() => setDeleteDialog(true)}
                >
                  Event löschen
                </Button>
              </CollapsibleContent>
            </section>
          </Collapsible>
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
            <CardContent className="space-y-6">
              <section
                aria-labelledby="finanz-notizen-heading"
                className="border-b border-border pb-5"
              >
                <h3 id="finanz-notizen-heading" className="font-medium text-foreground">
                  Finanznotizen
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Zusätzliche Informationen zu Auszahlungen und Rechnungsempfängern.
                </p>
                <Textarea
                  aria-label="Finanznotizen"
                  className="mt-3 min-h-24"
                  value={form.finanzNotizen ?? ""}
                  onChange={(e) => set("finanzNotizen", e.target.value)}
                  placeholder="z. B. Abweichende Zahlungsvereinbarungen …"
                />
              </section>
              <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <section
                  aria-labelledby="auszahlungsempfaenger-heading"
                  className="rounded-lg border border-border bg-muted/20 p-4"
                >
                  <div className="mb-3">
                    <h3 id="auszahlungsempfaenger-heading" className="font-medium text-foreground">
                      Auszahlungsempfänger
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Genau ein Empfänger für Auszahlungen.
                    </p>
                  </div>
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
                </section>
                <section
                  aria-labelledby="rechnungsempfaenger-heading"
                  className="rounded-lg border border-border bg-muted/20 p-4"
                >
                  <div className="mb-3">
                    <h3 id="rechnungsempfaenger-heading" className="font-medium text-foreground">
                      Rechnungsempfänger
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">Mehrere Empfänger möglich.</p>
                  </div>
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
                </section>
              </div>
              <PayoutsPanel
                eventId={event.id}
                recipientId={detail.payoutRecipientId}
                recipientEmail={detail.payoutRecipient?.email}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kontakte">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("nav.contacts")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <section
                aria-labelledby="kontakte-notizen-heading"
                className="border-b border-border pb-5"
              >
                <h3 id="kontakte-notizen-heading" className="font-medium text-foreground">
                  Kontaktnotizen
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Zusätzliche Informationen zur Kontaktorganisation dieses Events.
                </p>
                <Textarea
                  aria-label="Kontaktnotizen"
                  className="mt-3 min-h-24"
                  value={form.kontakteNotizen ?? ""}
                  onChange={(e) => set("kontakteNotizen", e.target.value)}
                  placeholder="z. B. bevorzugte Ansprechpartner oder Erreichbarkeit …"
                />
              </section>
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
                            <SelectionBadge
                              {...(selectionLists.eventRoles.find((item) => item.name === role) ?? {
                                name: role,
                              })}
                            />
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
                                      <SelectionBadge
                                        {...(selectionLists.eventRoles.find(
                                          (item) => item.name === role,
                                        ) ?? { name: role })}
                                      />
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

        <TabsContent value="hardware">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hardware</CardTitle>
              <CardDescription>Ausgaben und Rückläufer dieses Events verwalten.</CardDescription>
            </CardHeader>
            <CardContent>
              <HardwareWorkspace eventId={event.id} />
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
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {form.kommunikation.length} Einträge in der Timeline
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {form.outlookMessageLastSuccessAt
                      ? `Zuletzt synchronisiert: ${formatCommunicationTime(form.outlookMessageLastSuccessAt)}`
                      : "Noch keine Outlook-Nachrichten synchronisiert."}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => void kommunikationSynchronisieren()}
                  disabled={detail.communicationSyncing || !form.outlookFolderId}
                >
                  <FolderSync className="size-4" />
                  {detail.communicationSyncing ? "Synchronisiere …" : "Synchronisieren"}
                </Button>
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
              <div className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-1" aria-label="Kommunikation filtern">
                  {(
                    [
                      ["all", "Alle"],
                      ["email", "E-Mails"],
                      ["activity", "Aktivitäten"],
                    ] as const
                  ).map(([value, label]) => (
                    <Button
                      key={value}
                      size="sm"
                      variant={communicationFilter === value ? "secondary" : "ghost"}
                      aria-pressed={communicationFilter === value}
                      onClick={() => setCommunicationFilter(value)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
                <div className="relative w-full sm:max-w-xs">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    aria-label="Kommunikation durchsuchen"
                    className="pl-9"
                    value={communicationSearch}
                    onChange={(event) => setCommunicationSearch(event.target.value)}
                    placeholder="Nachrichten durchsuchen …"
                  />
                </div>
                <Select
                  value={communicationContactFilter}
                  onValueChange={setCommunicationContactFilter}
                >
                  <SelectTrigger
                    aria-label="Kommunikation nach Kontakt filtern"
                    className="w-full sm:w-56"
                  >
                    <SelectValue placeholder="Kontakt: Alle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Kontakt: Alle</SelectItem>
                    <SelectItem value="unassigned">Ohne Kontakt</SelectItem>
                    {form.kontakte.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Timeline-Ansicht</p>
                  <p className="text-xs text-muted-foreground">
                    Drei Varianten zum direkten Vergleichen.
                  </p>
                </div>
                <div
                  className="flex flex-wrap gap-1 rounded-lg border border-border p-1"
                  aria-label="Timeline-Ansicht auswählen"
                >
                  {(
                    [
                      ["cards", "Hybrid", PanelsTopLeft],
                      ["conversation", "Dialog", MessageSquare],
                      ["compact", "Kompakt", Rows3],
                    ] as const
                  ).map(([value, label, ViewIcon]) => (
                    <Button
                      key={value}
                      size="sm"
                      variant={communicationView === value ? "secondary" : "ghost"}
                      aria-pressed={communicationView === value}
                      onClick={() => setCommunicationView(value)}
                    >
                      <ViewIcon className="size-4" aria-hidden="true" />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
              <details className="rounded-lg border border-border p-3">
                <summary className="cursor-pointer text-sm font-medium text-foreground">
                  Manuelle Aktivität erfassen
                </summary>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Input
                    aria-label="Neue Aktivität"
                    value={detail.newActivity}
                    onChange={(e) => detailWorkspace.setInput("newActivity", e.target.value)}
                    placeholder="Betreff der Notiz"
                  />
                  <Button onClick={() => void addActivity()}>Aktivität anlegen</Button>
                </div>
              </details>
              {form.kommunikation.length === 0 && (
                <p className="text-sm text-muted-foreground">Noch keine Einträge.</p>
              )}
              {form.kommunikation.length > 0 && communicationGroups.length === 0 && (
                <p className="text-sm text-muted-foreground">Keine Einträge für diese Auswahl.</p>
              )}
              <div
                ref={communicationTimelineRef}
                className={
                  communicationView === "cards"
                    ? "grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.65fr)]"
                    : "space-y-5"
                }
              >
                <div className={communicationView === "compact" ? "space-y-3" : "space-y-5"}>
                  {communicationGroups.map((group) => (
                    <section key={group.key} aria-label={`Kommunikation ${group.label}`}>
                      {group.conversation ? (
                        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2">
                          <h3 className="text-sm font-semibold text-foreground">{group.label}</h3>
                          <span className="text-xs text-muted-foreground">{group.period}</span>
                        </div>
                      ) : (
                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {group.label}
                        </h3>
                      )}
                      <div
                        className={
                          communicationView === "compact"
                            ? "overflow-hidden rounded-lg border border-border bg-background"
                            : "space-y-3 border-l-2 border-border pl-4"
                        }
                      >
                        {group.messages.map((message) => {
                          const Icon =
                            message.kanal === "E-Mail"
                              ? Mail
                              : message.kanal === "Telefon"
                                ? Phone
                                : StickyNote;
                          const eventContact = communicationTimeline.eventContactsByMessageId.get(
                            message.id,
                          );
                          const contact = communicationTimeline.contactsByMessageId.get(message.id);
                          const linkedContact = eventContact
                            ? {
                                id: eventContact.id,
                                label: eventContact.name,
                                eventRole: eventContact.rolle,
                              }
                            : contact
                              ? { id: contact.id, label: contact.name, eventRole: null }
                              : null;
                          const isTime2winOutgoing = communicationTimeline.time2winOutgoingIds.has(
                            message.id,
                          );
                          const expanded = expandedMessages.has(message.id);
                          const longPreview = message.text.length > 180;
                          const isReply = communicationTimeline.replyMessageIds.has(message.id);
                          const threadOrigin = message.conversationId
                            ? communicationTimeline.visibleThreadOrigins.get(message.conversationId)
                            : undefined;
                          const viewClasses =
                            communicationView === "compact"
                              ? "rounded-none border-0 border-b border-border px-3 py-2 shadow-none last:border-b-0"
                              : communicationView === "conversation"
                                ? message.richtung === "OUTGOING"
                                  ? "ml-8 rounded-2xl rounded-tr-sm p-4 shadow-sm sm:ml-24"
                                  : "mr-8 rounded-2xl rounded-tl-sm p-4 shadow-sm sm:mr-24"
                                : "rounded-lg p-4 shadow-sm";
                          return (
                            <article
                              key={message.id}
                              id={`communication-${message.id}`}
                              tabIndex={-1}
                              data-timeline-view={communicationView}
                              data-reply={isReply ? "true" : "false"}
                              className={`relative border ${viewClasses} ${
                                isTime2winOutgoing
                                  ? "border-primary/50 bg-primary/5"
                                  : eventContact
                                    ? "border-sky-300 bg-sky-50/70 dark:border-sky-800 dark:bg-sky-950/25"
                                    : "border-border bg-background"
                              }`}
                              onClick={() => selectCommunication(message.id)}
                              aria-current={
                                selectedCommunicationId === message.id ? "true" : undefined
                              }
                            >
                              {communicationView !== "compact" && (
                                <span
                                  className={`absolute -left-[1.58rem] top-5 size-3 rounded-full border-2 border-background ${
                                    isTime2winOutgoing
                                      ? "bg-primary"
                                      : eventContact
                                        ? "bg-sky-500"
                                        : "bg-muted-foreground"
                                  }`}
                                />
                              )}
                              <div className="flex flex-wrap items-start justify-between gap-1.5">
                                <div className="flex min-w-0 flex-1 items-center gap-2">
                                  <Icon
                                    className="size-4 shrink-0 text-muted-foreground"
                                    aria-hidden="true"
                                  />
                                  <h4
                                    className={`${communicationView === "compact" ? "truncate text-sm" : ""} font-medium text-foreground`}
                                    title={message.betreff}
                                  >
                                    {message.betreff}
                                  </h4>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Badge variant="outline">{message.kanal}</Badge>
                                  {message.richtung && (
                                    <Badge
                                      className={
                                        isTime2winOutgoing
                                          ? "border-transparent bg-primary text-primary-foreground"
                                          : undefined
                                      }
                                      variant="outline"
                                    >
                                      {message.richtung === "INCOMING" ? "Eingehend" : "Ausgehend"}
                                    </Badge>
                                  )}
                                  {isTime2winOutgoing && (
                                    <Badge
                                      className="size-7 shrink-0 rounded-full border-0 bg-transparent p-0"
                                      variant="secondary"
                                      aria-label="Von TIME2WIN gesendet"
                                      title="Von TIME2WIN gesendet"
                                    >
                                      <img
                                        className="size-7"
                                        src="/time2win_logo_button.svg"
                                        alt=""
                                        aria-hidden="true"
                                      />
                                    </Badge>
                                  )}
                                  {isReply && (
                                    <Badge className="gap-1" variant="secondary">
                                      <CornerDownRight className="size-3" aria-hidden="true" />
                                      Antwort
                                    </Badge>
                                  )}
                                  <time dateTime={message.datum}>
                                    {formatCommunicationTime(message.datum)}
                                  </time>
                                </div>
                              </div>
                              <p
                                className={`${communicationView === "compact" ? "mt-1 truncate text-xs" : "mt-2 text-sm"} text-muted-foreground`}
                                title={
                                  message.richtung === "OUTGOING"
                                    ? message.empfaenger
                                    : message.autor
                                }
                              >
                                {message.richtung === "OUTGOING" ? "An" : "Von"}:{" "}
                                {message.richtung === "OUTGOING"
                                  ? message.empfaenger
                                  : message.autor}
                              </p>
                              {linkedContact ? (
                                <a
                                  className={`${communicationView === "compact" ? "mt-1" : "mt-2"} inline-block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
                                  href={`/kontakte?person=${encodeURIComponent(linkedContact.id)}`}
                                >
                                  <Badge
                                    className={
                                      eventContact
                                        ? "border-sky-300 bg-sky-100 text-sky-950 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-100"
                                        : undefined
                                    }
                                    variant="secondary"
                                  >
                                    {eventContact
                                      ? `Eventkontakt · ${linkedContact.label}${linkedContact.eventRole ? ` (${linkedContact.eventRole})` : ""}`
                                      : `Kontakt: ${linkedContact.label}`}
                                  </Badge>
                                </a>
                              ) : message.kanal === "E-Mail" ? (
                                <Badge
                                  className={communicationView === "compact" ? "mt-1" : "mt-2"}
                                  variant="outline"
                                >
                                  Kein Kontakt zugeordnet
                                </Badge>
                              ) : null}
                              {isReply && threadOrigin && communicationView !== "conversation" && (
                                <button
                                  type="button"
                                  className={`${communicationView === "compact" ? "mt-1" : "mt-3"} flex max-w-full items-center gap-1 border-l-2 border-primary/40 pl-3 text-left text-xs font-medium text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
                                  onClick={() => {
                                    const original = document.getElementById(
                                      `communication-${threadOrigin.id}`,
                                    );
                                    original?.scrollIntoView({
                                      behavior: "smooth",
                                      block: "center",
                                    });
                                    original?.focus({ preventScroll: true });
                                  }}
                                >
                                  <CornerDownRight className="size-3 shrink-0" aria-hidden="true" />
                                  <span className="truncate">
                                    Antwort auf „{threadOrigin.betreff}“ vom{" "}
                                    {communicationDate(threadOrigin.datum)}
                                  </span>
                                </button>
                              )}
                              <p
                                data-communication-preview
                                className={`${communicationView === "compact" ? "mt-1" : "mt-3"} whitespace-pre-line text-sm text-foreground/80 ${communicationView === "compact" && !expanded ? "line-clamp-1 leading-5" : "leading-6"}`}
                              >
                                {expanded || !longPreview
                                  ? message.text
                                  : `${message.text.slice(0, 180).trimEnd()} …`}
                              </p>
                              <div
                                className={`${communicationView === "compact" ? "mt-1" : "mt-3"} flex flex-wrap items-center gap-3 text-xs`}
                              >
                                {longPreview && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto px-0 text-primary hover:bg-transparent hover:text-primary"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setExpandedMessages((current) => {
                                        const next = new Set(current);
                                        if (expanded) {
                                          next.delete(message.id);
                                        } else {
                                          next.add(message.id);
                                        }
                                        return next;
                                      });
                                    }}
                                  >
                                    {expanded ? (
                                      <ChevronUp className="size-3" />
                                    ) : (
                                      <ChevronDown className="size-3" />
                                    )}
                                    {expanded ? "Weniger anzeigen" : "Vollständige Vorschau"}
                                  </Button>
                                )}
                                {message.hatAnlagen && (
                                  <span className="flex items-center gap-1 text-muted-foreground">
                                    <Paperclip className="size-3" aria-hidden="true" /> Anlagen
                                    vorhanden
                                  </span>
                                )}
                                {message.outlookWebUrl && (
                                  <a
                                    className="font-medium text-primary hover:underline"
                                    href={message.outlookWebUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    In Outlook öffnen
                                  </a>
                                )}
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
                {communicationView === "cards" && selectedCommunication && !communicationSearch && (
                  <aside
                    ref={threadContextRef}
                    style={{ transform: `translateY(${threadContextOffset}px)` }}
                    className={`h-fit rounded-lg border bg-muted/20 p-4 lg:sticky lg:top-4 lg:transition-transform lg:duration-200 ${selectedCommunicationId ? "border-primary/60 shadow-sm" : "border-border"}`}
                    aria-label="Thread-Kontext"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Thread-Kontext
                        </p>
                        <h3 className="mt-1 font-semibold text-foreground">
                          {selectedCommunication.betreff}
                        </h3>
                      </div>
                      <Badge variant="outline">{selectedThread.length} Nachrichten</Badge>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant="secondary">{selectedCommunication.kanal}</Badge>
                      <Badge variant="outline">
                        {selectedCommunication.richtung === "INCOMING" ? "Eingehend" : "Ausgehend"}
                      </Badge>
                      <Badge variant="outline">Rückfrage</Badge>
                    </div>
                    <div className="mt-4 space-y-3 border-l-2 border-border pl-3">
                      {selectedThread.map((message) => (
                        <button
                          key={message.id}
                          type="button"
                          className={`block w-full rounded-md p-2 text-left hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${message.id === selectedCommunicationId ? "bg-background ring-1 ring-primary/30" : ""}`}
                          onClick={() => {
                            selectCommunication(message.id);
                            document
                              .getElementById(`communication-${message.id}`)
                              ?.scrollIntoView({ behavior: "smooth", block: "center" });
                          }}
                        >
                          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                            <span>
                              {message.richtung === "INCOMING" ? message.autor : "TIME2WIN"}
                            </span>
                            <time dateTime={message.datum}>
                              {formatCommunicationTime(message.datum)}
                            </time>
                          </div>
                          <p className="mt-1 line-clamp-2 text-sm text-foreground/80">
                            {message.text}
                          </p>
                        </button>
                      ))}
                    </div>
                    <p className="mt-4 text-xs text-muted-foreground">
                      Kontakt und Tags können hier künftig direkt bearbeitet werden.
                    </p>
                  </aside>
                )}
              </div>
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
      <AlertDialog
        open={seriesDialog}
        onOpenChange={(open) => {
          setSeriesDialog(open);
          if (!open) setSeriesSearch("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eventserie verwalten</AlertDialogTitle>
            <AlertDialogDescription>
              Verknüpfen Sie dieses Event mit einem bestehenden Termin. Es werden nur die
              Serienbeziehung und keine Eventdaten, Dateien oder TIME2WIN-Verknüpfungen geändert.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-3">
            <div>
              <Label htmlFor="series-target">Mit Event verknüpfen</Label>
              <Popover open={seriesPickerOpen} onOpenChange={setSeriesPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="series-target"
                    variant="outline"
                    className="mt-1.5 h-10 w-full justify-start font-normal"
                    aria-label="Mit Event verknüpfen"
                  >
                    {seriesTargetEventId
                      ? (() => {
                          const selected = seriesCandidates.find(
                            (item) => item.id === seriesTargetEventId,
                          );
                          return selected
                            ? `${selected.name} · ${formatDatum(selected.start)} · ${selected.eventcode}`
                            : "Event auswählen";
                        })()
                      : "Event auswählen"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[min(36rem,calc(100vw-2rem))] p-2">
                  <Input
                    aria-label="Event suchen"
                    placeholder="Event suchen …"
                    value={seriesSearch}
                    onChange={(e) => setSeriesSearch(e.target.value)}
                  />
                  <div className="mt-2 max-h-56 space-y-1 overflow-y-auto">
                    {visibleSeriesCandidates.length ? (
                      visibleSeriesCandidates.map((item) => (
                        <button
                          type="button"
                          key={item.id}
                          className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                          onClick={() => {
                            setSeriesTargetEventId(item.id);
                            setSeriesPickerOpen(false);
                          }}
                        >
                          {item.name}
                          <span className="ml-2 text-muted-foreground">
                            {formatDatum(item.start)} · {item.eventcode}
                          </span>
                        </button>
                      ))
                    ) : (
                      <p className="px-2 py-3 text-sm text-muted-foreground">Keine Treffer</p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            {form.seriesId && (
              <p className="text-sm text-muted-foreground">
                Dieses Event ist aktuell mit {seriesEvents.length - 1} weiteren Termin(en)
                verknüpft. Eine neue Auswahl verschiebt nur dieses Event in die gewählte Serie.
              </p>
            )}
          </div>
          <AlertDialogFooter>
            {form.seriesId && (
              <Button variant="outline" onClick={() => void updateSeries()}>
                Aus Serie entfernen
              </Button>
            )}
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              disabled={!seriesTargetEventId}
              onClick={(e) => {
                e.preventDefault();
                void updateSeries(seriesTargetEventId);
              }}
            >
              Verknüpfung speichern
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
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Event endgültig löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              „{event.name}“ ({event.eventcode}) wird dauerhaft gelöscht. Dieser Vorgang kann nicht
              rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void eventLoeschen();
              }}
            >
              Endgültig löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
