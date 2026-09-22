import { ProjectManagement } from "@/components/t2w/ProjectManagement";
import { DetailKarte, DetailRaster, Feld } from "@/components/t2w/DetailKarte";
import { TaskSummary } from "@/components/t2w/TaskSummary";
import { pmRead, type PmState } from "@/lib/t2w/project-management";
import { DataTable, SortHeader, useTableSort } from "@/components/t2w/DataTable";
import { Fragment, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  FileText,
  CircleCheck,
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ExternalLink,
  FolderPlus,
  FolderSync,
  HelpCircle,
  Link2,
  CalendarDays,
  Mail,
  MessagesSquare,
  Paperclip,
  Phone,
  Plus,
  Search,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
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
import { StatusBadge, StatusDot } from "@/components/t2w/StatusBadge";
import { FolderLink } from "@/components/t2w/FolderLink";
import { useT2W } from "@/lib/t2w/store";
import { apiUpdateEventSeries, apiEventByCode } from "@/lib/t2w/api";
import { useCrm } from "@/lib/crm/store";
import { eventContactRoleChoices, selectionListChoices } from "@/lib/t2w/selection-list-workspace";
import { useI18n } from "@/lib/i18n";
import { formatDatum, formatDatumMitZeit, formatZeitraum, heuteIso } from "@/lib/t2w/format";
import { buildEventcode, copyDateSuggestion, jahr } from "@/lib/t2w/eventcode";
import { createEventDetailWorkspace } from "@/lib/t2w/event-detail-workspace";
import { highlightSegments, projectCommunicationTimeline } from "@/lib/t2w/communication-timeline";
import { resolveEventFolderNavigation } from "@/lib/t2w/folder-navigation";
import { STATUS_ORDER, type Contact, type EventStatus, type T2WEvent } from "@/lib/t2w/types";
import { personName, type Kunde } from "@/lib/crm/types";
import { HardwareWorkspace } from "@/components/t2w/HardwareWorkspace";
import { PayoutsPanel, type PayoutKennzahlen } from "@/components/t2w/PayoutsPanel";
import { FilterResetChip } from "@/components/t2w/FilterChip";
import { ServiceBadge, SelectionBadge, selectionPresentation } from "@/components/t2w/ServiceBadge";
import { PageHeader } from "@/components/t2w/PageHeader";
import { Segment, segmentFeld } from "@/components/t2w/Segment";
import { MetricRow, MetricTile } from "@/components/t2w/MetricTile";
import { OrganizerLink } from "@/components/t2w/OrganizerLink";
import { MailClassifierTestSheet } from "@/components/t2w/MailClassifierTestSheet";
import { MailClassifierApplyButton } from "@/components/t2w/MailClassifierApplyButton";

/** Betrag mit Waehrung, oesterreichische Schreibweise. */
const geldbetrag = (wert: number, waehrung: string) =>
  `${wert.toLocaleString("de-AT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${waehrung}`;

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
  return formatDatumMitZeit(value);
}

function communicationDate(value: string) {
  return formatDatum(value);
}

/**
 * Art und Richtung teilen sich eine schmale Symbolspalte. Der Text steht im
 * barrierefreien Namen, nicht als zweite Spalte.
 * Siehe wiki/concepts/communication-display-design.md.
 */
function communicationChannelIcon(
  channel: string,
  options: readonly { name: string; icon?: string | null; color?: string | null }[],
) {
  const option = options.find((value) => value.name === channel);
  // Unbekannte Art: Sprechblase statt Lücke, damit die Zeile lesbar bleibt.
  return selectionPresentation(option ?? { name: channel, icon: "message-circle" }).Icon;
}

function communicationChannelLabel(message: { kanal: string; richtung?: string }, sent: boolean) {
  if (!message.richtung) return message.kanal;
  if (message.richtung === "OUTGOING")
    return sent ? `${message.kanal}, ausgehend von TIME2WIN` : `${message.kanal}, ausgehend`;
  return `${message.kanal}, eingehend`;
}

function communicationParty(message: { richtung?: string; autor: string; empfaenger?: string }) {
  return message.richtung === "OUTGOING"
    ? `An ${message.empfaenger ?? "—"}`
    : (message.autor ?? "—");
}

/** Kurze Zeitangabe für die Listenspalte: heute die Uhrzeit, sonst das Datum. */
function communicationShortTime(value: string) {
  const [datePart, timePart] = formatDatumMitZeit(value).split(", ");
  if (datePart === formatDatum(heuteIso())) return timePart ?? value;
  return datePart ?? value;
}

/** Hebt die Fundstellen der Suche im Text hervor. */
function Highlighted({ text, query }: { text: string; query: string }) {
  return (
    <>
      {highlightSegments(text, query).map((segment, index) =>
        segment.match ? (
          <mark key={index} className="rounded-sm bg-primary/25 text-foreground">
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  );
}

type CommunicationBezug = { id: string; label: string; event: boolean } | null;

/**
 * Eine Zeile der Kommunikationsliste. Der Betreff ist die Schaltfläche, die das
 * Nachrichtenpanel öffnet; der Bezug bleibt ein eigener Link auf die Person.
 */
function CommunicationRow({
  message,
  Icon,
  query,
  threadSize,
  bezug,
  thema,
  sent,
  onOpen,
  dense = false,
}: {
  message: T2WEvent["kommunikation"][number];
  Icon: LucideIcon;
  query: string;
  threadSize: number;
  bezug: CommunicationBezug;
  thema: { name: string; icon?: string | null; color?: string | null } | null;
  sent: boolean;
  onOpen: () => void;
  dense?: boolean;
}) {
  const label = communicationChannelLabel(message, sent);
  return (
    <div
      id={`communication-${message.id}`}
      data-communication-row={message.id}
      className={cn(
        "flex items-center gap-3.5 border-b px-4 last:border-b-0 hover:bg-muted/40",
        dense ? "py-1.5" : "py-2",
      )}
    >
      <span
        role="img"
        aria-label={label}
        title={label}
        className={cn(
          "flex w-9 shrink-0 items-center gap-0.5",
          sent ? "text-primary" : "text-muted-foreground",
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
        {message.richtung === "INCOMING" && <ArrowDownLeft className="size-3" aria-hidden="true" />}
        {message.richtung === "OUTGOING" && <ArrowUpRight className="size-3" aria-hidden="true" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpen}
            className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-foreground hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Highlighted text={message.betreff} query={query} />
          </button>
          {threadSize > 1 && (
            <span
              className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-muted-foreground"
              title={`Konversation, ${threadSize} Nachrichten`}
            >
              <MessagesSquare className="size-3" aria-hidden="true" />
              {threadSize}
            </span>
          )}
          {message.hatAnlagen && (
            <span className="shrink-0 text-muted-foreground" title="Anlagen vorhanden">
              <Paperclip className="size-3" aria-hidden="true" />
              <span className="sr-only">Anlagen vorhanden</span>
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          <span className="font-medium text-foreground/75">{communicationParty(message)}</span>
          {" · "}
          <Highlighted text={message.text} query={query} />
        </p>
      </div>
      <div className="hidden w-52 shrink-0 items-center gap-1 md:flex">
        {bezug && (
          <a
            href={`/kontakte?person=${encodeURIComponent(bezug.id)}`}
            className={cn(
              badgeVariants({ variant: bezug.event ? "secondary" : "outline" }),
              "min-w-0 max-w-full truncate",
            )}
          >
            {bezug.label}
          </a>
        )}
        {thema && <SelectionBadge name={thema.name} icon={thema.icon} color={thema.color} />}
        {!bezug && !thema && <span className="text-xs text-muted-foreground">Kein Bezug</span>}
      </div>
      <time
        dateTime={message.datum}
        title={formatCommunicationTime(message.datum)}
        className="w-20 shrink-0 text-right text-xs tabular-nums text-muted-foreground"
      >
        {communicationShortTime(message.datum)}
      </time>
    </div>
  );
}

type Bewerb = { id: number; name: string; participantCount: number | null };
/** Sortierwerte der Bewerbstabelle im TIME2WIN-Abgleich. */
const BEWERB_SPALTEN = [
  { key: "Bewerb", sortValue: (race: Bewerb) => race.name },
  { key: "Gemeldete TN", sortValue: (race: Bewerb) => race.participantCount ?? -1 },
] as const;
type BewerbSpalte = (typeof BEWERB_SPALTEN)[number]["key"];

/** Sortierwerte der Eventkontakte; die Aktionsspalte bleibt ungeordnet. */
const KONTAKT_SPALTEN = [
  { key: "Kontakt", sortValue: (k: Contact) => k.name },
  { key: "Rolle", sortValue: (k: Contact) => k.rolle },
  { key: "E-Mail", sortValue: (k: Contact) => k.email },
  { key: "Telefon", sortValue: (k: Contact) => k.telefon },
] as const;
type KontaktSpalte = (typeof KONTAKT_SPALTEN)[number]["key"];

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
  const { events, bereit, uebernehmeEvents } = useT2W();
  const event = events.find((e) => e.eventcode === eventcode);
  const [lookupError, setLookupError] = useState("");
  useEffect(() => {
    if (!bereit || event) return;
    let active = true;
    setLookupError("");
    apiEventByCode(eventcode)
      .then((found) => {
        if (active) uebernehmeEvents([found]);
      })
      .catch((e) => {
        if (active) setLookupError(e.message);
      });
    return () => {
      active = false;
    };
  }, [bereit, event, eventcode, uebernehmeEvents]);

  if (!bereit || (!event && !lookupError)) {
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
    currentUser,
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
  const bewerbTabelle = useTableSort<Bewerb, BewerbSpalte>(BEWERB_SPALTEN, {
    key: "Bewerb",
    direction: "asc",
  });
  const kontaktTabelle = useTableSort<Contact, KontaktSpalte>(KONTAKT_SPALTEN, {
    key: "Kontakt",
    direction: "asc",
  });
  const [finanzzahlen, setFinanzzahlen] = useState<PayoutKennzahlen>({
    waehrung: "EUR",
    offenBetrag: 0,
    offenAnzahl: 0,
    ausbezahltBetrag: 0,
    ausbezahltAnzahl: 0,
    belege: 0,
  });
  const [quartalsDialog, setQuartalsDialog] = useState(false);
  const [copyDialog, setCopyDialog] = useState(false);
  const [seriesDialog, setSeriesDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteAreaOpen, setDeleteAreaOpen] = useState(false);
  const [ordnerpfadeOffen, setOrdnerpfadeOffen] = useState(false);
  const [aufgabenlage, setAufgabenlage] = useState<PmState>();
  const [activeTab, updateActiveTab] = useState("stammdaten");
  const setActiveTab = (tab: string) => {
    if (tab === "finanz" && !currentUser.financeAccess) return;
    updateActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.pushState(null, "", url);
  };
  useEffect(() => {
    const sync = () => {
      const tab = new URLSearchParams(window.location.search).get("tab");
      updateActiveTab(
        tab &&
          [
            "stammdaten",
            "kontakte",
            "aufgaben",
            "dateien",
            "kommunikation",
            "hardware",
            ...(currentUser.financeAccess ? ["finanz"] : []),
            "time2win",
          ].includes(tab)
          ? tab
          : "stammdaten",
      );
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [currentUser.financeAccess]);
  const [saving, setSaving] = useState(false);
  const savedEventRef = useRef(event);
  const [seriesTargetEventIds, setSeriesTargetEventIds] = useState<string[]>([]);
  const [seriesSearch, setSeriesSearch] = useState("");
  const [seriesPickerOpen, setSeriesPickerOpen] = useState(false);
  const [seriesSaving, setSeriesSaving] = useState(false);
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
  // "all" oder der Name einer konfigurierten Nachrichtenart.
  const [communicationChannel, setCommunicationChannel] = useState<string>("all");
  const [communicationContactFilter, setCommunicationContactFilter] = useState("all");
  const [communicationTopicFilter, setCommunicationTopicFilter] = useState("all");
  const [communicationDirection, setCommunicationDirection] = useState<
    "all" | "INCOMING" | "OUTGOING"
  >("all");
  const [communicationSearch, setCommunicationSearch] = useState("");
  const [communicationAttachmentsOnly, setCommunicationAttachmentsOnly] = useState(false);
  const [communicationView, setCommunicationView] = useState<"verlauf" | "konversationen">(
    "verlauf",
  );
  const [openConversation, setOpenConversation] = useState<string | null>(null);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [selectedCommunicationId, setSelectedCommunicationId] = useState<string | null>(null);
  const communicationChannelOptions = selectionLists.communicationChannels;
  const communicationTopicOptions = selectionLists.communicationTopics;
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
          ...(person.email ? { email: person.email } : {}),
        })),
        ...((form.outlookMailbox ?? settings.outlookMailbox)
          ? { mailbox: form.outlookMailbox ?? settings.outlookMailbox ?? "" }
          : {}),
        channels: selectionListChoices(selectionLists.communicationChannels).map(
          (channel) => channel.name,
        ),
        criteria: {
          channel: communicationChannel,
          contactId: communicationContactFilter,
          topicId: communicationTopicFilter,
          direction: communicationDirection,
          search: communicationSearch,
          attachmentsOnly: communicationAttachmentsOnly,
          view: communicationView,
        },
      }),
    [
      selectionLists.communicationChannels,
      communicationAttachmentsOnly,
      communicationChannel,
      communicationContactFilter,
      communicationTopicFilter,
      communicationDirection,
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
      ) ?? null,
    [communicationTimeline.visibleMessages, selectedCommunicationId],
  );
  const selectedThread = communicationTimeline.selectedThread(selectedCommunicationId);
  const communicationFilterCount =
    (communicationContactFilter === "all" ? 0 : 1) +
    (communicationTopicFilter === "all" ? 0 : 1) +
    (communicationDirection === "all" ? 0 : 1) +
    (communicationAttachmentsOnly ? 1 : 0) +
    (communicationChannel === "all" ? 0 : 1);
  const resetCommunicationFilters = () => {
    setCommunicationChannel("all");
    setCommunicationContactFilter("all");
    setCommunicationTopicFilter("all");
    setCommunicationDirection("all");
    setCommunicationAttachmentsOnly(false);
  };

  useEffect(() => {
    detailWorkspace.accept(event, personen, kunden, events);
    savedEventRef.current = event;
  }, [detailWorkspace, event, personen, kunden, events]);
  useEffect(() => {
    void detailWorkspace.refreshOutlookPlan();
  }, [event.id, event.start, event.outlookOrdner, detailWorkspace]);
  // Die Aufgabenkarte der Stammdatenschiene zeigt dieselbe Lage wie der
  // Reiter Projektmanagement.  Sie liest sie eigenstaendig, damit die
  // Stammdaten nicht vom Aufbau jenes Reiters abhaengen; ein Fehlschlag
  // laesst die Karte einfach weg statt die Seite zu stoeren.
  useEffect(() => {
    let aktiv = true;
    void pmRead(event.id)
      .then((lage) => {
        if (aktiv) setAufgabenlage(lage);
      })
      .catch(() => {
        if (aktiv) setAufgabenlage(undefined);
      });
    return () => {
      aktiv = false;
    };
  }, [event.id]);
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
  async function assignCommunicationTopic(entryId: string, topicId: string | null) {
    try {
      await detailWorkspace.assignCommunicationTopic(entryId, topicId);
      toast.success(topicId ? "Thema zugeordnet." : "Thema entfernt.");
    } catch {
      toast.error("Thema konnte nicht gespeichert werden.");
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
  const selectedSeriesEvents = seriesCandidates.filter((item) =>
    seriesTargetEventIds.includes(item.id),
  );
  function openSeriesManagement() {
    setSeriesTargetEventIds(
      seriesEvents.filter((item) => item.id !== event.id).map((item) => item.id),
    );
    setSeriesSearch("");
    setSeriesDialog(true);
  }
  function setSeriesTargetSelected(targetEventId: string, selected: boolean) {
    setSeriesTargetEventIds((current) =>
      selected
        ? [...new Set([...current, targetEventId])]
        : current.filter((eventId) => eventId !== targetEventId),
    );
  }
  async function updateSeries(targetEventIds?: string[]) {
    setSeriesSaving(true);
    try {
      await detailWorkspace.updateSeries(targetEventIds);
      setSeriesDialog(false);
      setSeriesTargetEventIds([]);
      toast.success(
        targetEventIds?.length ? "Eventserie gespeichert." : "Event aus der Serie entfernt.",
      );
    } catch {
      toast.error("Eventserie konnte nicht gespeichert werden. Bitte neu laden.");
    } finally {
      setSeriesSaving(false);
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

  // Die Rollenkarte der Kontaktschiene zaehlt jede bekannte Eventrolle, auch
  // die unbesetzten: das Artboard zeigt gerade daran, was noch fehlt.
  const eventRollenLage = useMemo(() => {
    const gezaehlt = new Map<string, number>();
    for (const rolle of selectionLists.eventRoles) {
      if (rolle.active) gezaehlt.set(rolle.name, 0);
    }
    for (const kontakt of form.kontakte) {
      gezaehlt.set(kontakt.rolle, (gezaehlt.get(kontakt.rolle) ?? 0) + 1);
    }
    return [...gezaehlt]
      .map(([name, anzahl]) => ({ name, anzahl }))
      .sort((a, b) => b.anzahl - a.anzahl || a.name.localeCompare(b.name, "de"));
  }, [selectionLists.eventRoles, form.kontakte]);

  // Jeder Detailreiter fuehrt seine eigene Notiz: was auf der Anmeldung zu
  // merken ist, gehoert nicht in die Stammdaten und nicht zur Abrechnung.
  // Die Karte sieht ueberall gleich aus, das Feld dahinter ist ein anderes.
  function notizenKarte(
    titel: string,
    id: string,
    feld: "notizen" | "anmeldungNotizen" | "finanzNotizen" | "kontakteNotizen",
    platzhalter: string,
  ) {
    return (
      <DetailKarte titel={titel} hinweis="Gilt nur für diesen Reiter">
        <Textarea
          id={id}
          rows={4}
          placeholder={platzhalter}
          value={form[feld] ?? ""}
          onChange={(e) => set(feld, e.target.value)}
        />
      </DetailKarte>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        krumen={[
          { label: "Übersicht", to: "/" },
          { label: "Veranstaltungen", to: "/veranstaltungen" },
        ]}
        titel={event.name}
        beschreibung={
          <>
            <OrganizerLink organizerId={event.veranstalterId} name={event.veranstalter} />
            {` · ${formatZeitraum(event.start, event.ende)} · ${event.eventcode}`}
          </>
        }
        aktion={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <StatusBadge status={form.status} />
            <Button variant="outline" onClick={openSeriesManagement}>
              Eventserie verwalten
            </Button>
            <Button variant="outline" onClick={() => setCopyDialog(true)}>
              Event kopieren
            </Button>
            {isDirty && (
              <span className="text-xs text-muted-foreground" aria-live="polite">
                Ungespeicherte Änderungen
              </span>
            )}
            <Button disabled={!isDirty || saving} onClick={speichern}>
              {saving ? "Wird gespeichert …" : "Änderungen speichern"}
            </Button>
          </div>
        }
      />

      {/* Das Artboard zeigt hier eine leichte Zeile statt eines Kastens: links
          die Serie, rechts der Zeitpunkt der letzten Aenderung.  Status und
          Aktionen stehen jetzt oben neben dem Titel. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="min-w-0">
          {form.seriesId && (
            <nav
              aria-label="Eventserie"
              data-testid="event-series-navigation"
              className="flex flex-wrap items-center gap-2 text-sm"
            >
              <span className="text-muted-foreground">Eventserie:</span>
              {previousEvent ? (
                <Link
                  aria-label={`Vorheriges Event: ${previousEvent.name}`}
                  data-testid="previous-series-event"
                  className={badgeVariants({
                    variant: "outline",
                    className: "h-7 max-w-full gap-1.5 px-2 font-medium hover:bg-accent",
                  })}
                  to="/events/$eventcode"
                  params={{ eventcode: previousEvent.eventcode }}
                >
                  <span aria-hidden="true">←</span>
                  <span className="text-muted-foreground">Vorheriges:</span>
                  <span className="min-w-0 truncate">{previousEvent.name}</span>
                </Link>
              ) : (
                <Badge variant="outline" className="h-7 px-2 font-medium text-muted-foreground">
                  ← Kein vorheriges Event
                </Badge>
              )}
              {nextEvent ? (
                <Link
                  aria-label={`Nächstes Event: ${nextEvent.name}`}
                  data-testid="next-series-event"
                  className={badgeVariants({
                    variant: "outline",
                    className: "h-7 max-w-full gap-1.5 px-2 font-medium hover:bg-accent",
                  })}
                  to="/events/$eventcode"
                  params={{ eventcode: nextEvent.eventcode }}
                >
                  <span className="text-muted-foreground">Nächstes:</span>
                  <span className="min-w-0 truncate">{nextEvent.name}</span>
                  <span aria-hidden="true">→</span>
                </Link>
              ) : (
                <Badge variant="outline" className="h-7 px-2 font-medium text-muted-foreground">
                  Kein nächstes Event →
                </Badge>
              )}
            </nav>
          )}
        </div>
        {/* Wer den Datensatz zuletzt angefasst hat, steht im Auditlog -- den
            darf nur ein Admin lesen. Der Zeitpunkt kommt vom Event selbst und
            gilt damit fuer jedes Konto. */}
        {event.zuletztGeaendertAm && (
          <span className="ml-auto text-xs text-muted-foreground">
            {`Zuletzt geändert ${formatDatumMitZeit(event.zuletztGeaendertAm)}`}
          </span>
        )}
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
          <TabsList
            variante="unterstrich"
            className="min-w-0 w-full max-w-full flex-wrap justify-start"
          >
            <TabsTrigger variante="unterstrich" value="stammdaten">
              Stammdaten
            </TabsTrigger>
            <TabsTrigger variante="unterstrich" value="time2win">
              Anmeldung
            </TabsTrigger>
            {currentUser.financeAccess && (
              <TabsTrigger variante="unterstrich" value="finanz">
                Finanz
              </TabsTrigger>
            )}
            <TabsTrigger variante="unterstrich" value="kontakte">
              Kontakte
            </TabsTrigger>
            <TabsTrigger
              variante="unterstrich"
              id="event-tab-aufgaben"
              className="hidden md:inline-flex"
              value="aufgaben"
            >
              Projektmanagement
            </TabsTrigger>
            <TabsTrigger
              variante="unterstrich"
              id="event-tab-dateien"
              className="hidden md:inline-flex"
              value="dateien"
            >
              Dateien
            </TabsTrigger>
            <TabsTrigger
              variante="unterstrich"
              id="event-tab-kommunikation"
              className="hidden md:inline-flex"
              value="kommunikation"
            >
              Kommunikation
            </TabsTrigger>
            <TabsTrigger
              variante="unterstrich"
              id="event-tab-hardware"
              className="hidden md:inline-flex"
              value="hardware"
            >
              Hardware
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
                  ["aufgaben", "Projektmanagement"],
                  ["dateien", "Dateien"],
                  ["kommunikation", "Kommunikation"],
                  ["hardware", "Hardware"],
                ].map(([value, label]) => (
                  <DropdownMenuItem key={value} asChild>
                    <button
                      type="button"
                      onPointerDown={() => {
                        if (value) setActiveTab(value);
                        document.getElementById(`event-tab-${value}`)?.click();
                      }}
                      onClick={() => {
                        if (value) setActiveTab(value);
                      }}
                    >
                      {label}
                    </button>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {/* Der Reiter folgt dem freigegebenen Artboard: links die Eckdaten in
            drei Karten, rechts eine Schiene mit allem, was neben der Arbeit
            steht.  Vorher war alles eine einzige Karte über die volle Breite.
            „Bundesland“ und „Treffpunkt Team“ aus dem Entwurf fehlen weiter —
            dafür gibt es kein Feld im Eventdatensatz. */}
        <TabsContent value="stammdaten">
          <DetailRaster
            schiene={
              <>
                {notizenKarte(
                  "Stammdatennotiz",
                  "d-notizen",
                  "notizen",
                  "z. B. Absprachen zum Eventrahmen …",
                )}

                <DetailKarte
                  titel="Ordner"
                  hinweis={
                    form.outlookOrdner && form.sharepointOrdner
                      ? "Beide verknüpft"
                      : form.outlookOrdner
                        ? "Nur Outlook"
                        : form.sharepointOrdner
                          ? "Nur SharePoint"
                          : "Noch nicht verknüpft"
                  }
                  inhaltKlasse="space-y-2"
                >
                  {(
                    [
                      ["outlook", "Outlook", form.outlookOrdner],
                      ["sharepoint", "SharePoint", form.sharepointOrdner],
                    ] as const
                  ).map(([id, label, pfad]) => (
                    <div
                      key={id}
                      className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-2.5 py-2"
                    >
                      <FolderSync
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold">{label}</span>
                        <span className="block truncate font-mono text-[0.6875rem] text-muted-foreground">
                          {pfad || "—"}
                        </span>
                      </span>
                      <FolderLink destination={folders.find((ziel) => ziel.id === id)!} />
                    </div>
                  ))}
                  <p
                    aria-label="Outlook-Ordnerstatus"
                    className="flex items-start gap-2 text-xs text-muted-foreground"
                  >
                    {outlookExistence === "EXISTS" ? (
                      <CheckCircle2
                        className="mt-0.5 size-3.5 shrink-0 text-status-zugesagt"
                        aria-hidden="true"
                      />
                    ) : outlookExistence === "MISSING" ? (
                      <FolderPlus
                        className="mt-0.5 size-3.5 shrink-0 text-risk-beobachten"
                        aria-hidden="true"
                      />
                    ) : (
                      <HelpCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                    )}
                    <span>
                      {outlookExistence === "EXISTS"
                        ? "Ordner vorhanden – der bestehende Outlook-Ordner wird verwendet."
                        : outlookExistence === "MISSING"
                          ? "Ordner nicht vorhanden – er wird bei der Synchronisation neu erstellt."
                          : "Ordnerstatus konnte noch nicht geprüft werden."}
                    </span>
                  </p>
                  {/* Das Artboard zeigt die Ordner nur als zwei Zeilen zum
                      Anklicken.  Die Pfade müssen aber weiter zu ändern sein,
                      deshalb liegen sie eine Ebene tiefer statt offen in der
                      schmalen Schiene. */}
                  <Collapsible open={ordnerpfadeOffen} onOpenChange={setOrdnerpfadeOffen}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="-ml-2">
                        <Link2 className="size-4" aria-hidden="true" />
                        Pfade bearbeiten
                        {ordnerpfadeOffen ? (
                          <ChevronUp className="size-4" aria-hidden="true" />
                        ) : (
                          <ChevronDown className="size-4" aria-hidden="true" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 pt-2">
                      <Feld label="Outlook-Ordner" htmlFor="d-outlook">
                        <Input
                          id="d-outlook"
                          value={form.outlookOrdner ?? ""}
                          placeholder={outlookVorschlag}
                          onChange={(e) => set("outlookOrdner", e.target.value || null)}
                          className="font-mono text-xs"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="-ml-2 justify-self-start"
                          onClick={() => set("outlookOrdner", outlookVorschlag)}
                        >
                          <Link2 className="size-4" aria-hidden="true" />
                          Vorschlag übernehmen
                        </Button>
                      </Feld>
                      <Feld label="SharePoint-Ordner" htmlFor="d-sp">
                        <Input
                          id="d-sp"
                          value={form.sharepointOrdner ?? ""}
                          placeholder={`Events ${jahr(form.start)}/${event.eventcode}`}
                          onChange={(e) => set("sharepointOrdner", e.target.value || null)}
                          className="font-mono text-xs"
                        />
                        <p className="text-xs text-muted-foreground">
                          Jahres-Site:{" "}
                          {jahresSite ? jahresSite.url : "in Einstellungen noch nicht hinterlegt"}
                        </p>
                      </Feld>
                      <Feld label="Outlook-Web-Link" htmlFor="d-outlook-url">
                        <Input
                          id="d-outlook-url"
                          type="url"
                          value={form.outlookWebUrl ?? ""}
                          placeholder="https://outlook.office.com/mail/..."
                          readOnly
                          onChange={(e) => set("outlookWebUrl", e.target.value || null)}
                          className="text-xs"
                        />
                      </Feld>
                    </CollapsibleContent>
                  </Collapsible>
                  <div className="space-y-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={detail.outlookSyncing || !settings.outlookMailbox}
                      onClick={() => void outlookSynchronisieren()}
                    >
                      {detail.outlookSyncing
                        ? "Synchronisiere …"
                        : "Outlook-Ordner synchronisieren"}
                    </Button>
                    {detail.outlookSyncMessage && (
                      <p role="status" className="text-xs">
                        {detail.outlookSyncMessage}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Graph-Sync:{" "}
                      {form.outlookFolderSyncStatus === "SUCCESS"
                        ? `erfolgreich${form.outlookFolderLastSuccessAt ? ` am ${formatDatum(form.outlookFolderLastSuccessAt.slice(0, 10))}` : ""}`
                        : form.outlookFolderSyncStatus === "ERROR"
                          ? `Fehler${form.outlookFolderLastError ? `: ${form.outlookFolderLastError}` : ""}`
                          : form.outlookFolderSyncStatus === "SYNCING"
                            ? "läuft …"
                            : "noch nicht ausgeführt"}
                    </p>
                  </div>
                </DetailKarte>

                <DetailKarte
                  titel="TIME2WIN-Abgleich"
                  hinweis="Anmeldedaten aus dem Backend"
                  inhaltKlasse="space-y-2.5"
                >
                  <p className="text-xs text-muted-foreground">
                    {form.time2winLastSuccessAt
                      ? `Letzter Abgleich am ${formatDatum(form.time2winLastSuccessAt.slice(0, 10))}${
                          form.teilnehmerwerte?.aktuell != null
                            ? ` · ${form.teilnehmerwerte.aktuell} Anmeldungen übernommen`
                            : ""
                        }.`
                      : "Noch kein Abgleich gelaufen."}
                  </p>
                  {form.time2winLastError && (
                    <p className="text-xs text-destructive">{form.time2winLastError}</p>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    className="w-full"
                    disabled={!form.t2wEventId || detail.time2winSyncing}
                    onClick={() => void time2winSynchronisieren()}
                  >
                    <FolderSync className="size-4" aria-hidden="true" />
                    {detail.time2winSyncing ? "Synchronisiere …" : "Jetzt synchronisieren"}
                  </Button>
                </DetailKarte>

                {aufgabenlage && (
                  <DetailKarte
                    titel="Aufgaben"
                    aktion={
                      <Button variant="outline" size="sm" onClick={() => setActiveTab("aufgaben")}>
                        Öffnen
                      </Button>
                    }
                  >
                    <TaskSummary
                      variante="schmal"
                      tasks={aufgabenlage.tasks}
                      eventStart={form.start}
                    />
                  </DetailKarte>
                )}

                <DetailKarte
                  titel="Gefahrenbereich"
                  className="border-destructive/30 bg-destructive/5"
                  inhaltKlasse="space-y-3"
                >
                  <div
                    data-testid="event-archive-toggle"
                    className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2"
                  >
                    <p className="text-sm font-medium text-foreground">Archiviert</p>
                    <Switch
                      aria-label="Event archivieren"
                      checked={form.archiviert}
                      onCheckedChange={(v) => set("archiviert", v)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Das Event und die zugehörigen Daten werden dauerhaft gelöscht. Dieser Vorgang
                    kann nicht rückgängig gemacht werden.
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => setDeleteDialog(true)}
                  >
                    Event löschen
                  </Button>
                </DetailKarte>
              </>
            }
          >
            <DetailKarte titel="Eckdaten" inhaltKlasse="grid gap-3 sm:grid-cols-2">
              <Feld label="Eventname" htmlFor="d-name">
                <Input
                  id="d-name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                />
              </Feld>
              <Feld label="Eventcode" hinweis="(unveränderlich)" htmlFor="d-code">
                <Input id="d-code" value={form.eventcode} readOnly disabled className="font-mono" />
              </Feld>
              <Feld label="TIME2WIN-ID" htmlFor="d-t2w-basic">
                <Input
                  id="d-t2w-basic"
                  type="number"
                  step="1"
                  value={form.t2wEventId ?? ""}
                  onChange={(e) =>
                    set("t2wEventId", e.target.value === "" ? null : Number(e.target.value))
                  }
                  className="font-mono"
                />
              </Feld>
              <Feld label="Veranstalter">
                <Select
                  value={form.veranstalterId ?? ""}
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
              </Feld>
              <Feld label="Sportart">
                <Select value={form.sportartId ?? ""} onValueChange={(id) => set("sportartId", id)}>
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
              </Feld>
              <Feld label="Status">
                <Select value={form.status} onValueChange={(v) => set("status", v as EventStatus)}>
                  <SelectTrigger aria-label="Status">
                    <span className="flex min-w-0 items-center gap-2">
                      <StatusDot status={form.status} />
                      <span className="truncate">
                        {t(`status.${form.status}` as Parameters<typeof t>[0])}
                      </span>
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_ORDER.map((s) => (
                      <SelectItem key={s} value={s}>
                        <span className="flex items-center gap-2">
                          <StatusDot status={s} />
                          <span>{t(`status.${s}` as Parameters<typeof t>[0])}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Feld>
            </DetailKarte>

            <DetailKarte titel="Ort und Zeit" inhaltKlasse="grid gap-3 sm:grid-cols-2">
              <Feld label={<>{t("Startdatum *")}</>} htmlFor="d-start">
                <Input
                  id="d-start"
                  type="date"
                  value={form.start}
                  onChange={(e) => set("start", e.target.value)}
                  aria-describedby="event-start-hint"
                />
                <span id="event-start-hint" className="sr-only">
                  {t("Das Startdatum ist verpflichtend.")}
                </span>
              </Feld>
              <Feld label={t("Enddatum")} htmlFor="d-ende">
                <Input
                  id="d-ende"
                  type="date"
                  value={form.ende}
                  onChange={(e) => set("ende", e.target.value)}
                />
              </Feld>
              <Feld label="Ort" htmlFor="d-ort">
                <Input id="d-ort" value={form.ort} onChange={(e) => set("ort", e.target.value)} />
              </Feld>
              <Feld label="Hauptverantwortlich" htmlFor="d-resp">
                <Input
                  id="d-resp"
                  value={form.verantwortlicher}
                  onChange={(e) => set("verantwortlicher", e.target.value)}
                />
              </Feld>
            </DetailKarte>

            {/* Das Artboard zeigt alle Leistungen als Chips zum An- und
                Abwählen statt einer Auswahlliste, die nur das Gesetzte zeigt. */}
            <DetailKarte titel="Leistungen" inhaltKlasse="space-y-3">
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Services">
                {services.map((service) => {
                  const gesetzt = form.serviceIds?.includes(service.id) ?? false;
                  return (
                    <button
                      key={service.id}
                      type="button"
                      aria-pressed={gesetzt}
                      onClick={() => {
                        const bisher = form.serviceIds ?? [];
                        const serviceIds = gesetzt
                          ? bisher.filter((id) => id !== service.id)
                          : [...bisher, service.id];
                        set("serviceIds", serviceIds);
                        set(
                          "services",
                          services
                            .filter((item) => serviceIds.includes(item.id))
                            .map((item) => item.name),
                        );
                      }}
                      className={cn(
                        "inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-sm transition-colors",
                        gesetzt
                          ? "border-primary bg-primary/10 font-semibold text-foreground"
                          : "border-input text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <ServiceBadge {...service} />
                    </button>
                  );
                })}
                {services.length === 0 && (
                  <p className="text-sm text-muted-foreground">Keine Leistungen hinterlegt.</p>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Feld label="Erwartete Teilnehmer" htmlFor="d-forecast">
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
                </Feld>
                <Feld label="Gemeldete Teilnehmer">
                  <p className="flex min-h-9 items-center text-sm tabular-nums text-muted-foreground">
                    {form.teilnehmerwerte?.aktuell ?? "—"}
                  </p>
                </Feld>
              </div>
            </DetailKarte>
          </DetailRaster>
        </TabsContent>

        {/* Nach dem Artboard: Kennzahlen oben, die Bewerbstabelle als
            Arbeitsfläche, die Verknüpfung in der Schiene.  „Nachmeldung“ und
            „Abgleichverlauf“ aus dem Entwurf fehlen — beides liefert das
            Backend nicht, und ein Verlauf wird nicht mitgeschrieben. */}
        <TabsContent value="time2win" className="space-y-3">
          <MetricRow>
            <MetricTile
              icon={Users}
              label="Gemeldete Teilnehmer"
              wert={form.teilnehmerwerte?.aktuell ?? "—"}
              hinweis={`von ${form.teilnehmerwerte?.prognose ?? form.teilnehmer} erwartet`}
            />
            <MetricTile
              icon={FolderSync}
              label="Letzter Abgleich"
              wert={
                form.time2winLastSuccessAt
                  ? formatDatum(form.time2winLastSuccessAt.slice(0, 10))
                  : "—"
              }
              hinweis={form.time2winSyncStatus ?? "NEVER"}
              {...(form.time2winLastError ? { ton: "krit" as const } : {})}
            />
            <MetricTile
              icon={CalendarDays}
              label="Eventbeginn"
              wert={formatDatum(form.start)}
              {...(form.ende !== form.start ? { hinweis: `bis ${formatDatum(form.ende)}` } : {})}
            />
          </MetricRow>

          <DetailRaster
            schiene={
              <>
                {notizenKarte(
                  "Anmeldenotiz",
                  "d-notizen-anmeldung",
                  "anmeldungNotizen",
                  "z. B. Nachmeldefenster oder Sonderfälle …",
                )}

                <DetailKarte
                  titel="TIME2WIN-Verknüpfung"
                  hinweis="Anmeldedaten kommen aus dem Backend"
                  inhaltKlasse="space-y-2.5"
                >
                  <Feld label="Event-ID">
                    <p className="text-sm tabular-nums">{form.t2wEventId ?? "—"}</p>
                  </Feld>
                  <Feld label="Verknüpftes Event">
                    <p className="text-sm">{form.time2winSnapshot?.name ?? "—"}</p>
                  </Feld>
                  <Feld label="TIME2WIN-Sportart">
                    <p className="text-sm">{form.time2winSnapshot?.sportName ?? "—"}</p>
                  </Feld>
                  <p className="text-xs text-muted-foreground">
                    {form.time2winLastSuccessAt
                      ? `Abgleich ${form.time2winSyncStatus === "ERROR" ? "fehlgeschlagen" : "erfolgreich"} · ${formatDatum(form.time2winLastSuccessAt.slice(0, 10))}`
                      : "Noch kein Abgleich gelaufen."}
                  </p>
                  {form.time2winLastError && (
                    <p className="text-xs text-destructive">{form.time2winLastError}</p>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    className="w-full"
                    disabled={!form.t2wEventId || detail.time2winSyncing}
                    onClick={() => void time2winSynchronisieren()}
                  >
                    <FolderSync className="size-4" aria-hidden="true" />
                    {detail.time2winSyncing ? "Synchronisiere …" : "Jetzt synchronisieren"}
                  </Button>
                </DetailKarte>
              </>
            }
          >
            <DetailKarte
              titel="Teilnehmer nach Bewerb"
              hinweis={
                form.time2winSnapshot?.races.length
                  ? `${form.time2winSnapshot.races.length} ${form.time2winSnapshot.races.length === 1 ? "Bewerb" : "Bewerbe"} aus TIME2WIN übernommen`
                  : undefined
              }
            >
              {form.time2winSnapshot?.races.length ? (
                <DataTable
                  exportName={`${form.name} Teilnehmer nach Bewerb`}
                  className="min-w-[22rem]"
                  aria-label="TIME2WIN Teilnehmer nach Bewerb"
                >
                  <TableHeader>
                    <TableRow>
                      {BEWERB_SPALTEN.map((spalte) => (
                        <TableHead
                          key={spalte.key}
                          className={spalte.key === "Gemeldete TN" ? "text-right" : undefined}
                        >
                          <SortHeader
                            label={spalte.key}
                            active={bewerbTabelle.sort.key === spalte.key}
                            direction={bewerbTabelle.sort.direction}
                            onSort={() => bewerbTabelle.sortBy(spalte.key)}
                          />
                        </TableHead>
                      ))}
                      {/* Der Anteil steht im Artboard neben der Zahl; er ist
                          aus den Zahlen ableitbar und braucht keine neue
                          Schnittstelle. */}
                      <TableHead className="text-right">Anteil</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bewerbTabelle.rows(form.time2winSnapshot.races).map((race) => {
                      const gesamt = form.teilnehmerwerte?.aktuell ?? 0;
                      const anteil =
                        gesamt > 0 && race.participantCount != null
                          ? Math.round((race.participantCount / gesamt) * 100)
                          : null;
                      return (
                        <TableRow key={race.id}>
                          <TableCell className="font-medium">{race.name}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {race.participantCount ?? "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {anteil == null ? "—" : `${anteil} %`}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell>Gesamt</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {form.teilnehmerwerte?.aktuell ?? "—"}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableFooter>
                </DataTable>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Noch keine TIME2WIN-Bewerbe geladen.
                </p>
              )}
            </DetailKarte>
          </DetailRaster>
        </TabsContent>

        {/* Nach dem Artboard: Belege als Arbeitsfläche, die beiden Empfänger in
            der Schiene rechts.  „Nenngeld gesamt“, „Rechnung offen“ und die
            Tabelle „Leistungen und Konditionen“ aus dem Entwurf fehlen --
            dafür gibt es weder Preise noch Rechnungen im Datenbestand. */}
        {currentUser.financeAccess && (
          <TabsContent value="finanz" className="space-y-3">
            <MetricRow>
              <MetricTile
                icon={Receipt}
                label="Auszahlung offen"
                wert={geldbetrag(finanzzahlen.offenBetrag, finanzzahlen.waehrung)}
                hinweis={`${finanzzahlen.offenAnzahl} ${finanzzahlen.offenAnzahl === 1 ? "Beleg" : "Belege"}`}
                {...(finanzzahlen.offenAnzahl > 0 ? { ton: "warn" as const } : {})}
              />
              <MetricTile
                icon={CircleCheck}
                label="Bereits ausbezahlt"
                wert={geldbetrag(finanzzahlen.ausbezahltBetrag, finanzzahlen.waehrung)}
                hinweis={`${finanzzahlen.ausbezahltAnzahl} ${finanzzahlen.ausbezahltAnzahl === 1 ? "Beleg" : "Belege"}`}
              />
              <MetricTile
                icon={FileText}
                label="Belege gesamt"
                wert={finanzzahlen.belege}
                hinweis={detail.payoutRecipient?.name ?? "kein Empfänger gewählt"}
              />
            </MetricRow>

            <DetailRaster
              schiene={
                <>
                  {notizenKarte(
                    "Finanznotiz",
                    "d-notizen-finanz",
                    "finanzNotizen",
                    "z. B. abweichende Zahlungsvereinbarungen …",
                  )}

                  <DetailKarte
                    titel="Auszahlungsempfänger"
                    hinweis="Wohin das Nenngeld fließt"
                    inhaltKlasse="space-y-3"
                  >
                    <Feld label="Empfänger wählen">
                      <Select
                        value={detail.payoutRecipientId ?? ""}
                        onValueChange={(id) => set("auszahlungsempfaengerId", id)}
                      >
                        <SelectTrigger aria-label="Auszahlungsempfänger">
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
                    </Feld>
                    {detail.payoutRecipient && (
                      <div aria-label="Stammdaten Auszahlungsempfänger">
                        <RecipientMasterData recipient={detail.payoutRecipient} />
                      </div>
                    )}
                  </DetailKarte>

                  <DetailKarte
                    titel="Rechnungsempfänger"
                    hinweis="Wer die Leistung bezahlt"
                    inhaltKlasse="space-y-3"
                  >
                    <Feld label="Empfänger suchen">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            aria-label="Rechnungsempfänger auswählen"
                            variant="outline"
                            className="w-full justify-start font-normal"
                          >
                            <span className="min-w-0 truncate">
                              {detail.invoiceRecipients.length
                                ? detail.invoiceRecipients.map((kunde) => kunde.name).join(", ")
                                : "Rechnungsempfänger auswählen"}
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          align="start"
                          className="w-[min(28rem,calc(100vw-2rem))] p-2"
                        >
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
                              <p className="px-2 py-3 text-sm text-muted-foreground">
                                Keine Treffer
                              </p>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </Feld>
                    {detail.invoiceRecipients.length > 0 && (
                      <div aria-label="Stammdaten Rechnungsempfänger" className="space-y-3">
                        {detail.invoiceRecipients.map((kunde) => (
                          <RecipientMasterData key={kunde.id} recipient={kunde} />
                        ))}
                      </div>
                    )}
                  </DetailKarte>
                </>
              }
            >
              <DetailKarte
                titel="Auszahlungen dieses Events"
                hinweis={`${finanzzahlen.belege} ${finanzzahlen.belege === 1 ? "Beleg" : "Belege"}`}
              >
                <PayoutsPanel
                  eventId={event.id}
                  ohneKopf
                  onKennzahlen={setFinanzzahlen}
                  recipientId={detail.payoutRecipientId ?? null}
                  {...(detail.payoutRecipient?.email
                    ? { recipientEmail: detail.payoutRecipient.email }
                    : {})}
                />
              </DetailKarte>
            </DetailRaster>
          </TabsContent>
        )}

        {/* Nach dem Artboard: die Zuordnungen als Arbeitsfläche, daneben die
            Rollenübersicht.  Die eigene Kontaktnotiz ist entfallen, die
            Eventnotiz in der Schiene ersetzt sie. */}
        <TabsContent value="kontakte">
          <DetailRaster
            schiene={
              <>
                {notizenKarte(
                  "Kontaktnotiz",
                  "d-notizen-kontakte",
                  "kontakteNotizen",
                  "z. B. bevorzugte Ansprechpartner oder Erreichbarkeit …",
                )}

                <DetailKarte
                  titel="Rollen dieses Events"
                  inhaltKlasse="space-y-3"
                  aktion={
                    <Link
                      to="/einstellungen"
                      search={{ tab: "auswahllisten", liste: "eventrollen" }}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Rollen verwalten
                    </Link>
                  }
                >
                  <div className="space-y-1.5">
                    {eventRollenLage.map((rolle) => (
                      <div
                        key={rolle.name}
                        className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5"
                      >
                        <span className="min-w-0 flex-1 truncate text-xs font-semibold">
                          {rolle.name}
                        </span>
                        <span
                          className={cn(
                            "text-xs tabular-nums",
                            rolle.anzahl === 0 && "text-muted-foreground",
                          )}
                        >
                          {rolle.anzahl === 0 ? "nicht besetzt" : rolle.anzahl}
                        </span>
                      </div>
                    ))}
                    {eventRollenLage.length === 0 && (
                      <p className="text-sm text-muted-foreground">Keine Eventrollen hinterlegt.</p>
                    )}
                  </div>
                  <p className="text-xs leading-snug text-muted-foreground">
                    Inaktive Rollen bleiben an bestehenden Zuordnungen sichtbar, stehen für neue
                    aber nicht zur Wahl.
                  </p>
                </DetailKarte>
              </>
            }
          >
            <DetailKarte
              titel={t("nav.contacts")}
              hinweis="Explizit für dieses Event zugeordnete Kontakte."
              inhaltKlasse="space-y-3"
            >
              <div className="flex flex-wrap gap-2">
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
                  <Plus className="size-4" aria-hidden="true" />
                  Kontakt zuordnen
                </Button>
              </div>
              {form.kontakte.length === 0 ? (
                <p className="text-sm text-muted-foreground">Noch keine Kontakte hinterlegt.</p>
              ) : (
                <DataTable exportName={`${form.name} Kontakte`} className="text-sm">
                  <thead className="t2w-table-header text-left">
                    <tr>
                      {KONTAKT_SPALTEN.map((spalte) => (
                        <th key={spalte.key} className="px-3 py-2">
                          <SortHeader
                            label={spalte.key}
                            active={kontaktTabelle.sort.key === spalte.key}
                            direction={kontaktTabelle.sort.direction}
                            onSort={() => kontaktTabelle.sortBy(spalte.key)}
                          />
                        </th>
                      ))}
                      <th className="px-3 py-2">
                        <span className="sr-only">Aktion</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {kontaktTabelle.rows(form.kontakte).map((k) => (
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
                </DataTable>
              )}
            </DetailKarte>

            <DetailKarte
              titel="Kontakte des Veranstalters"
              hinweis="Stammdatenkontakte des ausgewählten Veranstalters."
            >
              {!event.veranstalterId ? (
                <p className="text-sm text-muted-foreground">Kein Veranstalter ausgewählt.</p>
              ) : detail.organizerContacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Für diesen Veranstalter sind keine Kontakte hinterlegt.
                </p>
              ) : (
                <div className="space-y-2">
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
            </DetailKarte>
          </DetailRaster>
        </TabsContent>

        <TabsContent value="aufgaben">
          <ProjectManagement eventId={form.id} eventStart={form.start} />
        </TabsContent>

        {/* Nach dem Artboard: die Dateiliste als Arbeitsfläche, der Ordner und
            das Verknüpfen in der Schiene.  Der aus SharePoint gespiegelte
            Ordnerinhalt aus dem Entwurf fehlt — dafür gibt es keine
            Dienstschnittstelle; die Liste zeigt die einzeln verknüpften
            Dateien. */}
        <TabsContent value="dateien">
          <DetailRaster
            schiene={
              <>
                <DetailKarte
                  titel="Verknüpfter Ordner"
                  hinweis="Quelle der Ablage"
                  inhaltKlasse="space-y-2"
                >
                  {form.sharepointOrdner ? (
                    <>
                      <div className="rounded-lg border border-border bg-muted/40 px-2.5 py-2">
                        <span className="block text-xs font-semibold">SharePoint</span>
                        <span className="block break-all font-mono text-[0.6875rem] text-muted-foreground">
                          {form.sharepointOrdner}
                        </span>
                      </div>
                      <FolderLink destination={folders.find(({ id }) => id === "sharepoint")!} />
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Kein SharePoint-Ordner hinterlegt. Einzeln verknüpfte Dateien bleiben
                      sichtbar.
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Dateien werden hier nicht gespeichert, nur verknüpft.
                  </p>
                </DetailKarte>

                <DetailKarte
                  titel="Einzeln verknüpfen"
                  hinweis="Außerhalb des Eventordners"
                  inhaltKlasse="space-y-2"
                >
                  <Input
                    aria-label="Dateiverknüpfung"
                    value={detail.newFile}
                    onChange={(e) => detailWorkspace.setInput("newFile", e.target.value)}
                    placeholder="Dateiname oder SharePoint-Link"
                  />
                  <Button className="w-full" onClick={() => void addFile()}>
                    <Plus className="size-4" aria-hidden="true" />
                    Verknüpfen
                  </Button>
                </DetailKarte>
              </>
            }
          >
            <DetailKarte
              titel="Dateien"
              hinweis={
                form.dateien.length
                  ? `${form.dateien.length} ${form.dateien.length === 1 ? "Eintrag" : "Einträge"}`
                  : undefined
              }
            >
              {form.dateien.length === 0 ? (
                <p className="text-sm text-muted-foreground">Keine Dateien verknüpft.</p>
              ) : (
                <DataTable exportName={`${form.name} Dateien`} className="text-sm">
                  <thead className="t2w-table-header text-left">
                    <tr>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Größe</th>
                      <th className="px-3 py-2">Geändert</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {form.dateien.map((f) => (
                      <tr key={f.id}>
                        <td className="px-3 py-2 font-medium text-foreground">{f.name}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                          {f.groesse}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                          {formatDatum(f.aktualisiert)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </DataTable>
              )}
            </DetailKarte>
          </DetailRaster>
        </TabsContent>

        {/* Nach dem Artboard: die Ausgaben als Arbeitsfläche, der Hinweis zur
            Rückgabe daneben.  Kennzahlkacheln, Statusfilter und das
            Ausgabeprotokoll aus dem Entwurf fehlen noch — sie brauchen Zahlen
            und einen Verlauf, die der Hardwarebestand heute nicht liefert. */}
        <TabsContent value="hardware">
          <DetailRaster
            schiene={
              <DetailKarte titel="Hinweis zur Rückgabe">
                <p className="text-xs leading-snug text-muted-foreground">
                  Offene Positionen bleiben dem Event zugeordnet, bis die Rückgabe erfasst ist.
                  Rückgabefristen stehen an der jeweiligen Ausgabe.
                </p>
              </DetailKarte>
            }
          >
            <DetailKarte
              titel="Hardware"
              hinweis="Ausgaben und Rückläufer dieses Events verwalten."
            >
              <HardwareWorkspace eventId={event.id} />
            </DetailKarte>
          </DetailRaster>
        </TabsContent>
        <TabsContent value="kommunikation" className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            {/* Die Ueberschrift "Kommunikation" ist entfallen: der Reiter
                darueber sagt es schon, und das Artboard beginnt mit der
                Zeile darunter. */}
            <div>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold tabular-nums text-foreground">
                  {form.kommunikation.length}
                </span>{" "}
                Einträge
                {form.outlookMessageLastSuccessAt
                  ? ` · zuletzt synchronisiert ${formatCommunicationTime(form.outlookMessageLastSuccessAt)}`
                  : " · noch nicht synchronisiert"}
                {form.outlookOrdner ? (
                  <>
                    {" · Ordner "}
                    <span className="font-medium text-foreground">{form.outlookOrdner}</span>
                  </>
                ) : null}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <MailClassifierTestSheet event={event} />
              <MailClassifierApplyButton
                eventId={event.id}
                messageCount={
                  form.kommunikation.filter((message) => message.kanal === "E-Mail").length
                }
                onApplied={() => void kommunikationSynchronisieren()}
              />
              <Button
                variant="outline"
                aria-expanded={showActivityForm}
                onClick={() => setShowActivityForm((open) => !open)}
              >
                <Plus className="size-4" aria-hidden="true" />
                Notiz erfassen
              </Button>
              <Button
                onClick={() => void kommunikationSynchronisieren()}
                disabled={detail.communicationSyncing || !form.outlookFolderId}
              >
                <FolderSync className="size-4" aria-hidden="true" />
                {detail.communicationSyncing ? "Synchronisiere …" : "Synchronisieren"}
              </Button>
            </div>
          </div>

          {showActivityForm && (
            <div className="flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row">
              <Input
                aria-label="Neue Aktivität"
                value={detail.newActivity}
                onChange={(e) => detailWorkspace.setInput("newActivity", e.target.value)}
                placeholder="Betreff der Notiz"
              />
              <Button onClick={() => void addActivity()}>Aktivität anlegen</Button>
            </div>
          )}

          {detail.communicationSyncMessage && (
            <p role="status" className="text-sm text-muted-foreground">
              {detail.communicationSyncMessage}
            </p>
          )}

          {!form.outlookFolderId && (
            <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              Kein Outlook-Eventordner hinterlegt. Ohne Ordner fehlen die E-Mails; erfasste Einträge
              bleiben sichtbar.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-64 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Kommunikation durchsuchen"
                className="pl-9"
                value={communicationSearch}
                onChange={(event) => setCommunicationSearch(event.target.value)}
                placeholder="Betreff, Absender, Adresse oder Text durchsuchen …"
              />
            </div>
            <Segment label="Ansicht wählen" className="shrink-0">
              {(
                [
                  ["verlauf", "Verlauf"],
                  ["konversationen", "Konversationen"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={communicationView === value}
                  onClick={() => setCommunicationView(value)}
                  className={segmentFeld(communicationView === value)}
                >
                  {label}
                </button>
              ))}
            </Segment>
          </div>

          <div className="flex flex-wrap items-center gap-2" aria-label="Kommunikation filtern">
            <Button
              size="sm"
              className="rounded-full"
              variant={communicationChannel === "all" ? "secondary" : "outline"}
              aria-pressed={communicationChannel === "all"}
              onClick={() => setCommunicationChannel("all")}
            >
              Alle{" "}
              <span className="tabular-nums text-muted-foreground">
                {communicationTimeline.totalCount}
              </span>
            </Button>
            {communicationTimeline.channelNames.map((channel) => {
              const ChannelIcon = communicationChannelIcon(channel, communicationChannelOptions);
              const active = communicationChannel === channel;
              return (
                <Button
                  key={channel}
                  size="sm"
                  className="rounded-full"
                  variant={active ? "secondary" : "outline"}
                  aria-pressed={active}
                  onClick={() => setCommunicationChannel(active ? "all" : channel)}
                >
                  <ChannelIcon className="size-4" aria-hidden="true" />
                  {channel}{" "}
                  <span className="font-semibold tabular-nums">
                    {communicationTimeline.channelCounts[channel]}
                  </span>
                </Button>
              );
            })}
            <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
            <Select
              value={communicationContactFilter}
              onValueChange={setCommunicationContactFilter}
            >
              <SelectTrigger aria-label="Nach Bezug filtern" className="h-8 w-auto rounded-full">
                <SelectValue placeholder="Bezug: Alle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Bezug: Alle</SelectItem>
                <SelectItem value="unassigned">Ohne Bezug</SelectItem>
                {form.kontakte.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={communicationTopicFilter} onValueChange={setCommunicationTopicFilter}>
              <SelectTrigger aria-label="Nach Thema filtern" className="h-8 w-auto rounded-full">
                <SelectValue placeholder="Thema: Alle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Thema: Alle</SelectItem>
                {selectionListChoices(communicationTopicOptions).map((topic) => (
                  <SelectItem key={topic.id} value={topic.id}>
                    {topic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={communicationDirection}
              onValueChange={(value) =>
                setCommunicationDirection(value as "all" | "INCOMING" | "OUTGOING")
              }
            >
              <SelectTrigger aria-label="Nach Richtung filtern" className="h-8 w-auto rounded-full">
                <SelectValue placeholder="Richtung: Alle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Richtung: Alle</SelectItem>
                <SelectItem value="INCOMING">Eingehend</SelectItem>
                <SelectItem value="OUTGOING">Ausgehend</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              className="rounded-full"
              variant={communicationAttachmentsOnly ? "secondary" : "outline"}
              aria-pressed={communicationAttachmentsOnly}
              onClick={() => setCommunicationAttachmentsOnly((only) => !only)}
            >
              <Paperclip className="size-4" aria-hidden="true" />
              mit Anlagen{" "}
              <span className="font-semibold tabular-nums">
                {communicationTimeline.attachmentCount}
              </span>
            </Button>
            <FilterResetChip count={communicationFilterCount} onReset={resetCommunicationFilters} />
          </div>

          {communicationSearch.trim() && (
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold tabular-nums text-foreground">
                {communicationTimeline.matchCount}
              </span>{" "}
              Treffer für „{communicationSearch.trim()}“
            </p>
          )}

          {form.kommunikation.length === 0 ? (
            <div className="rounded-lg border bg-card px-4 py-8 text-center">
              <p className="text-sm font-medium text-foreground">Noch keine Einträge</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Synchronisieren holt die E-Mails aus dem Eventordner; alles andere wird erfasst.
              </p>
            </div>
          ) : communicationTimeline.matchCount === 0 ? (
            <div className="rounded-lg border bg-card px-4 py-8 text-center">
              <p className="text-sm font-medium text-foreground">
                Keine Einträge für diese Auswahl.
              </p>
              {communicationFilterCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={resetCommunicationFilters}
                >
                  {communicationFilterCount} Filter zurücksetzen
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border bg-card">
              <div className="hidden items-center gap-3.5 border-b bg-muted/30 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground md:flex">
                <span className="w-9">Art</span>
                <span className="flex-1">
                  {communicationView === "verlauf" ? "Betreff und Vorschau" : "Konversation"}
                </span>
                <span className="w-52">Bezug</span>
                <span className="w-20 text-right">
                  {communicationView === "verlauf" ? "Zeit" : "Zeitraum"}
                </span>
              </div>

              {communicationView === "verlauf"
                ? communicationGroups.map((group) => (
                    <section key={group.key} aria-label={`Kommunikation ${group.label}`}>
                      <h3 className="flex items-center gap-2 border-b bg-muted/40 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {group.label}
                        <span className="font-semibold tabular-nums opacity-70">
                          {group.messages.length}
                        </span>
                      </h3>
                      {group.messages.map((message) => {
                        const eventContact = communicationTimeline.eventContactsByMessageId.get(
                          message.id,
                        );
                        const crmContact = communicationTimeline.contactsByMessageId.get(
                          message.id,
                        );
                        const bezug = eventContact
                          ? {
                              id: eventContact.id,
                              label: eventContact.rolle
                                ? `${eventContact.name} · ${eventContact.rolle}`
                                : eventContact.name,
                              event: true,
                            }
                          : crmContact
                            ? { id: crmContact.id, label: crmContact.name, event: false }
                            : null;
                        return (
                          <CommunicationRow
                            key={message.id}
                            message={message}
                            Icon={communicationChannelIcon(
                              message.kanal,
                              communicationChannelOptions,
                            )}
                            thema={
                              communicationTopicOptions.find(
                                (topic) => topic.id === message.themaId,
                              ) ?? null
                            }
                            query={communicationSearch}
                            threadSize={communicationTimeline.threadSize(message)}
                            bezug={bezug}
                            sent={communicationTimeline.time2winOutgoingIds.has(message.id)}
                            onOpen={() => setSelectedCommunicationId(message.id)}
                          />
                        );
                      })}
                    </section>
                  ))
                : [...communicationTimeline.conversations, ...communicationTimeline.singles].map(
                    (conversation, index) => {
                      const ConversationIcon = communicationChannelIcon(
                        conversation.channel,
                        communicationChannelOptions,
                      );
                      const open = openConversation === conversation.key;
                      const last = conversation.messages[conversation.messages.length - 1];
                      // Einträge ohne Konversation bekommen ihre eigene Überschrift.
                      const startsSingles =
                        index === communicationTimeline.conversations.length &&
                        communicationTimeline.singles.length > 0;
                      return (
                        <Fragment key={conversation.key}>
                          {startsSingles && (
                            <h3 className="flex items-center gap-2 border-b bg-muted/40 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                              Einzelne Einträge
                              <span className="font-semibold tabular-nums opacity-70">
                                {communicationTimeline.singles.length}
                              </span>
                            </h3>
                          )}
                          <section
                            aria-label={`Konversation ${conversation.label}`}
                            className="border-b last:border-b-0"
                          >
                            <button
                              type="button"
                              aria-expanded={open}
                              onClick={() => setOpenConversation(open ? null : conversation.key)}
                              className="flex w-full items-center gap-3.5 px-4 py-2 text-left hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                            >
                              <span className="flex w-9 shrink-0 items-center gap-0.5 text-muted-foreground">
                                {open ? (
                                  <ChevronDown className="size-4" aria-hidden="true" />
                                ) : (
                                  <ChevronRight className="size-4" aria-hidden="true" />
                                )}
                                <ConversationIcon className="size-4" aria-hidden="true" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-2">
                                  <span className="min-w-0 truncate text-sm font-semibold text-foreground">
                                    <Highlighted
                                      text={conversation.label}
                                      query={communicationSearch}
                                    />
                                  </span>
                                  {conversation.messages.length > 1 && (
                                    <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                                      <MessagesSquare className="size-3" aria-hidden="true" />
                                      {conversation.messages.length}
                                    </span>
                                  )}
                                  {conversation.attachments > 0 && (
                                    <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                                      <Paperclip className="size-3" aria-hidden="true" />
                                      {conversation.attachments}
                                    </span>
                                  )}
                                </span>
                                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                  {last
                                    ? `Zuletzt: ${communicationParty(last)} · ${last.text}`
                                    : ""}
                                </span>
                              </span>
                              <span className="hidden w-52 shrink-0 truncate text-xs text-muted-foreground md:block">
                                {(() => {
                                  const contact = last
                                    ? communicationTimeline.eventContactsByMessageId.get(last.id)
                                    : undefined;
                                  return contact ? contact.name : "Kein Bezug";
                                })()}
                              </span>
                              <span className="w-20 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                                {conversation.period}
                              </span>
                            </button>
                            {open && (
                              <div className="border-t bg-muted/20 pl-9">
                                {conversation.messages.map((message) => {
                                  const eventContact =
                                    communicationTimeline.eventContactsByMessageId.get(message.id);
                                  const crmContact = communicationTimeline.contactsByMessageId.get(
                                    message.id,
                                  );
                                  const bezug = eventContact
                                    ? {
                                        id: eventContact.id,
                                        label: eventContact.rolle
                                          ? `${eventContact.name} · ${eventContact.rolle}`
                                          : eventContact.name,
                                        event: true,
                                      }
                                    : crmContact
                                      ? { id: crmContact.id, label: crmContact.name, event: false }
                                      : null;
                                  return (
                                    <CommunicationRow
                                      key={message.id}
                                      dense
                                      message={message}
                                      Icon={communicationChannelIcon(
                                        message.kanal,
                                        communicationChannelOptions,
                                      )}
                                      thema={
                                        communicationTopicOptions.find(
                                          (topic) => topic.id === message.themaId,
                                        ) ?? null
                                      }
                                      query={communicationSearch}
                                      threadSize={1}
                                      bezug={bezug}
                                      sent={communicationTimeline.time2winOutgoingIds.has(
                                        message.id,
                                      )}
                                      onOpen={() => setSelectedCommunicationId(message.id)}
                                    />
                                  );
                                })}
                              </div>
                            )}
                          </section>
                        </Fragment>
                      );
                    },
                  )}
            </div>
          )}

          <Sheet
            open={!!selectedCommunication}
            onOpenChange={(shown) => !shown && setSelectedCommunicationId(null)}
          >
            <SheetContent
              closeLabel="Nachricht schließen"
              className="flex w-full flex-col gap-0 p-0 sm:max-w-xl"
            >
              {selectedCommunication && (
                <>
                  <SheetHeader className="space-y-0 border-b p-5 text-left">
                    <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      {(() => {
                        const HeaderIcon = communicationChannelIcon(
                          selectedCommunication.kanal,
                          communicationChannelOptions,
                        );
                        return <HeaderIcon className="size-4" aria-hidden="true" />;
                      })()}
                      {communicationChannelLabel(
                        selectedCommunication,
                        communicationTimeline.time2winOutgoingIds.has(selectedCommunication.id),
                      )}
                    </p>
                    <SheetTitle className="mt-2 text-lg leading-snug">
                      {selectedCommunication.betreff}
                    </SheetTitle>
                    <SheetDescription className="mt-1">
                      {communicationParty(selectedCommunication)} ·{" "}
                      {formatCommunicationTime(selectedCommunication.datum)}
                    </SheetDescription>
                    {selectedThread.length > 1 && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Nachricht{" "}
                        <span className="font-semibold tabular-nums text-foreground">
                          {selectedThread.findIndex(
                            (message) => message.id === selectedCommunication.id,
                          ) + 1}
                        </span>{" "}
                        von{" "}
                        <span className="font-semibold tabular-nums text-foreground">
                          {selectedThread.length}
                        </span>{" "}
                        in dieser Konversation
                      </p>
                    )}
                  </SheetHeader>

                  <div className="flex-1 space-y-5 overflow-auto p-5">
                    <dl className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Von
                        </dt>
                        <dd className="mt-1 break-words text-sm">{selectedCommunication.autor}</dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          An
                        </dt>
                        <dd className="mt-1 break-words text-sm">
                          {selectedCommunication.empfaenger || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Zeitpunkt
                        </dt>
                        <dd className="mt-1 text-sm tabular-nums">
                          {formatCommunicationTime(selectedCommunication.datum)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Bezug
                        </dt>
                        <dd className="mt-1 text-sm">
                          {(() => {
                            const eventContact = communicationTimeline.eventContactsByMessageId.get(
                              selectedCommunication.id,
                            );
                            const crmContact = communicationTimeline.contactsByMessageId.get(
                              selectedCommunication.id,
                            );
                            const contact = eventContact ?? crmContact;
                            if (!contact)
                              return <span className="text-muted-foreground">Kein Bezug</span>;
                            return (
                              <a
                                href={`/kontakte?person=${encodeURIComponent(contact.id)}`}
                                className={cn(
                                  badgeVariants({
                                    variant: eventContact ? "secondary" : "outline",
                                  }),
                                )}
                              >
                                {eventContact && eventContact.rolle
                                  ? `${eventContact.name} · ${eventContact.rolle}`
                                  : contact.name}
                              </a>
                            );
                          })()}
                        </dd>
                      </div>
                    </dl>

                    <div className="rounded-lg border bg-muted/20 p-3">
                      <label
                        htmlFor="communication-topic"
                        className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                      >
                        Thema
                      </label>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Für Einträge ohne einzelne Person – etwa eine Sammelmail zum Thema
                        „Teilnehmer“. Die Person bleibt davon unberührt.
                      </p>
                      <Select
                        value={selectedCommunication.themaId ?? "none"}
                        onValueChange={(value) => {
                          void assignCommunicationTopic(
                            selectedCommunication.id,
                            value === "none" ? null : value,
                          );
                        }}
                      >
                        <SelectTrigger id="communication-topic" className="mt-2">
                          <SelectValue placeholder="Kein Thema" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Kein Thema</SelectItem>
                          {selectionListChoices(
                            communicationTopicOptions,
                            selectedCommunication.themaId,
                          ).map((topic) => (
                            <SelectItem key={topic.id} value={topic.id}>
                              {topic.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Nachricht
                      </p>
                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-foreground/90">
                        {selectedCommunication.text}
                      </p>
                    </div>

                    {selectedCommunication.hatAnlagen && (
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Paperclip className="size-4" aria-hidden="true" />
                        Anlagen vorhanden – sie liegen in Outlook.
                      </p>
                    )}

                    {selectedThread.length > 1 && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Konversation
                        </p>
                        <div className="mt-2 space-y-1 border-l-2 pl-3">
                          {selectedThread.map((message) => (
                            <button
                              key={message.id}
                              type="button"
                              onClick={() => setSelectedCommunicationId(message.id)}
                              className={cn(
                                "block w-full rounded-md px-2 py-1.5 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                message.id === selectedCommunication.id && "bg-muted",
                              )}
                            >
                              <span className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                                <span className="truncate">{communicationParty(message)}</span>
                                <time dateTime={message.datum} className="shrink-0 tabular-nums">
                                  {communicationShortTime(message.datum)}
                                </time>
                              </span>
                              <span className="mt-0.5 block truncate text-sm text-foreground/80">
                                {message.text}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <SheetFooter className="flex-row items-center gap-2 border-t bg-muted/20 p-4">
                    {selectedCommunication.outlookWebUrl && (
                      <a
                        href={selectedCommunication.outlookWebUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(buttonVariants({ size: "sm" }))}
                      >
                        <ExternalLink className="size-4" aria-hidden="true" />
                        In Outlook öffnen
                      </a>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedCommunicationId(null)}
                    >
                      Schließen
                    </Button>
                  </SheetFooter>
                </>
              )}
            </SheetContent>
          </Sheet>
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
          if (!open) {
            setSeriesSearch("");
            setSeriesPickerOpen(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eventserie verwalten</AlertDialogTitle>
            <AlertDialogDescription>
              Das geöffnete Event ist automatisch enthalten. Wählen Sie alle weiteren Termine, die
              gemeinsam eine Eventserie bilden sollen. Eventdaten, Dateien und
              TIME2WIN-Verknüpfungen bleiben unverändert.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-3">
            <div>
              <Label htmlFor="series-target">Events dieser Serie</Label>
              <Popover open={seriesPickerOpen} onOpenChange={setSeriesPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="series-target"
                    variant="outline"
                    className="mt-1.5 h-10 w-full justify-start font-normal"
                    aria-label="Events dieser Serie auswählen"
                  >
                    {selectedSeriesEvents.length
                      ? `${selectedSeriesEvents.length} ${selectedSeriesEvents.length === 1 ? "Event" : "Events"} ausgewählt`
                      : "Events auswählen"}
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
                      visibleSeriesCandidates.map((item) => {
                        const checkboxId = `series-target-${item.id}`;
                        return (
                          <div
                            key={item.id}
                            className="flex min-h-11 items-center gap-3 rounded px-2 hover:bg-accent"
                          >
                            <Checkbox
                              id={checkboxId}
                              checked={seriesTargetEventIds.includes(item.id)}
                              onCheckedChange={(checked) =>
                                setSeriesTargetSelected(item.id, checked === true)
                              }
                            />
                            <Label
                              htmlFor={checkboxId}
                              className="min-w-0 flex-1 cursor-pointer py-2 text-sm font-normal"
                            >
                              <span className="block truncate font-medium">{item.name}</span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {formatDatum(item.start)} · {item.eventcode}
                              </span>
                            </Label>
                          </div>
                        );
                      })
                    ) : (
                      <p className="px-2 py-3 text-sm text-muted-foreground">Keine Treffer</p>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 border-t border-border pt-2">
                    <span className="text-xs text-muted-foreground" aria-live="polite">
                      {selectedSeriesEvents.length} ausgewählt
                    </span>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setSeriesPickerOpen(false)}
                    >
                      Auswahl übernehmen
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              {selectedSeriesEvents.length ? (
                <div
                  aria-label="Ausgewählte Serientermine"
                  aria-live="polite"
                  className="mt-2 flex flex-wrap gap-1.5"
                >
                  {selectedSeriesEvents.map((item) => (
                    <Badge key={item.id} variant="secondary" className="h-auto py-1 font-medium">
                      {item.name} · {formatDatum(item.start)}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">Keine weiteren Events gewählt.</p>
              )}
            </div>
            {form.seriesId && (
              <p className="text-sm text-muted-foreground">
                Dieses Event ist aktuell mit {seriesEvents.length - 1} weiteren Termin(en)
                verknüpft. Nicht ausgewählte bisherige Termine werden beim Speichern aus dieser
                Serie gelöst.
              </p>
            )}
          </div>
          <AlertDialogFooter>
            {form.seriesId && (
              <Button variant="outline" disabled={seriesSaving} onClick={() => void updateSeries()}>
                {seriesSaving ? "Wird gespeichert …" : "Aus Serie entfernen"}
              </Button>
            )}
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              disabled={!selectedSeriesEvents.length || seriesSaving}
              onClick={(e) => {
                e.preventDefault();
                void updateSeries(selectedSeriesEvents.map((item) => item.id));
              }}
            >
              {seriesSaving ? "Wird gespeichert …" : "Eventserie speichern"}
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
