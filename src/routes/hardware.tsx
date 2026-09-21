import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, PackageOpen, Plus, Search, TriangleAlert, type LucideIcon } from "lucide-react";
import { normalizeHardwareResponse } from "@/lib/t2w/hardware-response";
import { hardwareLifecycle } from "@/lib/t2w/hardware-lifecycle";
import { formatDatum } from "@/lib/t2w/format";
import { useT2W } from "@/lib/t2w/store";
import { HardwareWorkspace } from "@/components/t2w/HardwareWorkspace";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/t2w/PageHeader";
import { RecordSheet } from "@/components/t2w/RecordSheet";
import { MetricRow, MetricTile } from "@/components/t2w/MetricTile";
import { FilterBar, FilterTrenner } from "@/components/t2w/FilterBar";
import {
  ColumnPicker,
  DataTable,
  SortHeader,
  TableToolbar,
  useTableBehavior,
} from "@/components/t2w/DataTable";
import { FilterResetChip, ToggleChip } from "@/components/t2w/FilterChip";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
type Hardware = {
  id: string;
  recipientName: string;
  issueType: string;
  objectName: string;
  objectNumberSingle?: string;
  objectNumberPrefix?: string;
  objectNumberFrom?: number;
  objectNumberTo?: number;
  quantity: number;
  status: string;
  dueDate?: string;
  email?: string;
  phone?: string;
  note?: string;
  event: { id?: string; eventCode: string; name: string } | null;
};
type InlineDraft = {
  recipientName: string;
  email: string | undefined;
  phone: string | undefined;
  issueType: string;
  objectName: string;
  quantity: number;
  status: string;
  dueDate: string | undefined;
  note: string | undefined;
  eventId: string;
  objectNumber: string;
};
const validEmail = (value: string) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const labels: Record<string, string> = {
  OPEN: "Offen",
  MAIL_SEND: "Mail senden",
  NOTIFIED: "Benachrichtigt",
  RETURNED: "Retourniert",
  COMPLETED: "Abgeschlossen",
  PARTICIPANT: "Teilnehmer",
  RENTAL: "Verleih",
  OTHER: "Sonstige",
};
function number(item: Hardware) {
  if (item.objectNumberSingle) return item.objectNumberSingle;
  if (item.objectNumberPrefix && item.objectNumberFrom != null && item.objectNumberTo != null)
    return `${item.objectNumberPrefix}${String(item.objectNumberFrom).padStart(3, "0")}–${item.objectNumberPrefix}${String(item.objectNumberTo).padStart(3, "0")}`;
  return "—";
}
function isOverdue(item: Hardware, today: string) {
  return Boolean(
    item.dueDate &&
    item.dueDate.slice(0, 10) < today &&
    item.status !== "RETURNED" &&
    item.status !== "COMPLETED",
  );
}
function statusBadge(item: Hardware, today: string) {
  const label = labels[item.status] ?? item.status;
  if (isOverdue(item, today))
    return (
      <Badge variant="destructive" className="gap-1">
        <TriangleAlert className="size-3" aria-hidden="true" /> {label}
      </Badge>
    );
  if (item.status === "OPEN" || item.status === "MAIL_SEND")
    return (
      <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
        {label}
      </Badge>
    );
  if (item.status === "NOTIFIED") return <Badge variant="secondary">{label}</Badge>;
  return <Badge variant="outline">{label}</Badge>;
}
function objectNumberChanges(value: string) {
  const trimmed = value.trim();
  if (!trimmed)
    return {
      objectNumberType: "NONE",
      objectNumberSingle: null,
      objectNumberPrefix: null,
      objectNumberFrom: null,
      objectNumberTo: null,
    };
  const range = trimmed.match(/^(.*?)(\d+)\s*[–-]\s*.*?(\d+)$/);
  if (range) {
    return {
      objectNumberType: "RANGE",
      objectNumberSingle: null,
      objectNumberPrefix: range[1],
      objectNumberFrom: Number(range[2]),
      objectNumberTo: Number(range[3]),
      objectNumberPadding: range[2]!.length,
    };
  }
  return {
    objectNumberType: "SINGLE",
    objectNumberSingle: trimmed,
    objectNumberPrefix: null,
    objectNumberFrom: null,
    objectNumberTo: null,
  };
}
function cell(item: Hardware, column: HardwareColumn, today: string): ReactNode {
  if (column === "Event")
    return item.event ? (
      <Link
        className="text-primary hover:underline"
        to="/events/$eventcode"
        params={{ eventcode: item.event.eventCode }}
        onClick={(event) => event.stopPropagation()}
      >
        {item.event.name}
      </Link>
    ) : (
      <span className="text-muted-foreground">Kein Event zugeordnet</span>
    );
  if (column === "Empfänger") return item.recipientName;
  if (column === "E-Mail") return item.email ?? "—";
  if (column === "Telefon") return item.phone ?? "—";
  if (column === "Art") return labels[item.issueType] ?? item.issueType;
  if (column === "Objekt") return item.objectName;
  if (column === "Nummer") return number(item);
  if (column === "Anzahl") return item.quantity;
  if (column === "Status") return statusBadge(item, today);
  if (column === "Kommentar") return item.note ?? "—";
  return (
    <span className={isOverdue(item, today) ? "font-medium text-destructive" : undefined}>
      {item.dueDate ? formatDatum(item.dueDate) : "—"}
    </span>
  );
}
const HARDWARE_COLUMNS = [
  "Event",
  "Empfänger",
  "E-Mail",
  "Telefon",
  "Art",
  "Objekt",
  "Nummer",
  "Anzahl",
  "Status",
  "Fälligkeit",
  "Kommentar",
] as const;
type HardwareColumn = (typeof HARDWARE_COLUMNS)[number];
const HARDWARE_TABLE_COLUMNS = HARDWARE_COLUMNS.map((key) => ({
  key,
  sortValue: (item: Hardware) => {
    const values: Record<HardwareColumn, string | number> = {
      Event: item.event?.name ?? "",
      Empfänger: item.recipientName,
      "E-Mail": item.email ?? "",
      Telefon: item.phone ?? "",
      Art: labels[item.issueType] ?? item.issueType,
      Objekt: item.objectName,
      Nummer: number(item),
      Anzahl: item.quantity,
      Status: labels[item.status] ?? item.status,
      Fälligkeit: item.dueDate ?? "",
      Kommentar: item.note ?? "",
    };
    return values[key];
  },
})) as unknown as readonly {
  key: HardwareColumn;
  sortValue: (item: Hardware) => string | number;
}[];
export const Route = createFileRoute("/hardware")({ component: HardwarePage });
function HardwarePage() {
  const { selectionLists } = useT2W();
  const [items, setItems] = useState<Hardware[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("active");
  const [issueType, setIssueType] = useState("all");
  const [event, setEvent] = useState("");
  const [overdue, setOverdue] = useState(false);
  const [events, setEvents] = useState<{ id: string; name: string; eventCode: string }[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("none");
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineDraft, setInlineDraft] = useState<InlineDraft | null>(null);
  const [savingInline, setSavingInline] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [inlineEmailError, setInlineEmailError] = useState<string | null>(null);
  const [newHardware, setNewHardware] = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const pendingSaves = useRef(0);
  const table = useTableBehavior<Hardware, HardwareColumn>({
    storageKey: "t2w-hardware-table-columns",
    columns: HARDWARE_TABLE_COLUMNS,
    initialSort: { key: "Event", direction: "asc" },
  });
  useEffect(() => {
    fetch("/api/v1/events?limit=1000", { credentials: "include" })
      .then((r) => r.json())
      .then((value) => setEvents(normalizeHardwareResponse(value)))
      .catch(() => setEvents([]));
  }, []);
  const loadItems = useCallback(() => {
    const params = new URLSearchParams({ q });
    if (status !== "active") params.set("status", status);
    if (issueType !== "all") params.set("issueType", issueType);
    return fetch(`/api/v1/events/hardware?${params}`, { credentials: "include" })
      .then((r) => r.json())
      .then((value) => setItems(normalizeHardwareResponse<Hardware>(value)))
      .catch(() => setItems([]));
  }, [q, status, issueType]);
  useEffect(() => {
    void loadItems();
  }, [loadItems]);
  useEffect(() => {
    if (!inlineEditingId) return;
    const finishEditing = (pointerEvent: PointerEvent) => {
      const target = pointerEvent.target;
      if (
        target instanceof Element &&
        (target.closest('[data-inline-editing="true"]') ||
          target.closest("[data-radix-popper-content-wrapper]"))
      )
        return;
      window.setTimeout(() => {
        setInlineEditingId((current) => {
          if (current !== inlineEditingId) return current;
          setInlineDraft(null);
          return null;
        });
      }, 0);
    };
    document.addEventListener("pointerdown", finishEditing);
    return () => document.removeEventListener("pointerdown", finishEditing);
  }, [inlineEditingId]);
  const today = new Date().toISOString().slice(0, 10);
  const active = items.filter(
    (i) =>
      (!q ||
        [i.recipientName, i.email, i.phone, i.objectName, i.note, number(i), i.event?.name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q.toLowerCase())) &&
      (status !== "active" || (i.status !== "RETURNED" && i.status !== "COMPLETED")) &&
      (!event || i.event?.name.toLowerCase().includes(event.toLowerCase())) &&
      (!overdue || isOverdue(i, today)),
  );
  const rows = useMemo(() => table.rows(active), [active, table]);
  const overdueCount = active.filter((item) => isOverdue(item, today)).length;
  // Gezählt wird jede Abweichung von der Grundstellung — wie in den übrigen Listen.
  const activeFilterCount =
    (q ? 1 : 0) +
    (event ? 1 : 0) +
    (overdue ? 1 : 0) +
    (status === "active" ? 0 : 1) +
    (issueType === "all" ? 0 : 1);
  const resetFilters = () => {
    setQ("");
    setEvent("");
    setStatus("active");
    setIssueType("all");
    setOverdue(false);
  };
  const hardwareObjectNames = selectionLists.hardwareObjects
    .filter((value) => value.active)
    .map((value) => value.name);
  const beginInlineEdit = (item: Hardware) => {
    setInlineError(null);
    setInlineEmailError(null);
    setInlineEditingId(item.id);
    setInlineDraft({
      eventId: item.event?.id ?? "none",
      recipientName: item.recipientName,
      email: item.email,
      phone: item.phone,
      issueType: item.issueType,
      objectName: item.objectName,
      quantity: item.quantity,
      status: item.status,
      dueDate: item.dueDate?.slice(0, 10),
      note: item.note,
      objectNumber: number(item) === "—" ? "" : number(item),
    });
  };
  const saveInlineEdit = (item: Hardware, changes: Record<string, unknown>) => {
    pendingSaves.current += 1;
    setSavingInline(true);
    const persist = async () => {
      const updated = await hardwareLifecycle.save<Hardware>(
        item.event?.id ? { eventId: item.event.id } : {},
        { ...changes, id: item.id },
      );
      if (!updated) throw new Error("HARDWARE_SAVE_EMPTY_RESPONSE");
      setItems((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
    };
    const request = saveQueue.current.then(persist, persist);
    const settled = request.catch(() => {
      setInlineError("Änderungen konnten nicht gespeichert werden. Bitte erneut versuchen.");
    });
    saveQueue.current = settled;
    return settled.finally(() => {
      pendingSaves.current -= 1;
      if (pendingSaves.current === 0) setSavingInline(false);
    });
  };
  const metrics: { title: string; value: number; Icon: LucideIcon; ton?: "warn" | "krit" }[] = [
    {
      title: "Offen",
      value: active.filter((item) => item.status === "OPEN").length,
      Icon: PackageOpen,
    },
    {
      title: "Benachrichtigt",
      value: active.filter((item) => item.status === "NOTIFIED").length,
      Icon: Bell,
    },
    {
      title: "Überfällig",
      value: overdueCount,
      Icon: TriangleAlert,
      ...(overdueCount ? { ton: "krit" as const } : {}),
    },
    { title: "Gesamt aktiv", value: active.length, Icon: PackageOpen },
  ];
  return (
    <div>
      <PageHeader
        krumen={[{ label: "Übersicht", to: "/" }]}
        titel="Hardware"
        beschreibung="Eventübergreifende Rückgabeübersicht"
        aktion={
          <Button onClick={() => setNewHardware(true)}>
            <Plus className="size-4" />
            Hardware-Ausgabe anlegen
          </Button>
        }
      />
      <div className="space-y-3">
        <RecordSheet
          open={newHardware}
          onOpenChange={(offen) => {
            setNewHardware(offen);
            if (!offen) setSelectedEventId("none");
          }}
          titel="Hardware-Ausgabe anlegen"
          beschreibung="Neue Ausgabe für ein Event erfassen"
          marke={
            <span
              aria-hidden="true"
              className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-muted"
            >
              <PackageOpen className="size-5 text-table-header-foreground" />
            </span>
          }
        >
          <label className="grid gap-1.5 text-sm font-medium">
            Event (optional)
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger aria-label="Event zuordnen">
                <SelectValue placeholder="Event (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ohne Event (externer Verleih)</SelectItem>
                {events.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name} ({e.eventCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <HardwareWorkspace
            {...(selectedEventId === "none" ? {} : { eventId: selectedEventId })}
            createOnMount
            onSaved={() => {
              void loadItems();
              setNewHardware(false);
              setSelectedEventId("none");
            }}
            showList={false}
          />
        </RecordSheet>
        <MetricRow>
          {metrics.map(({ title, value, Icon, ton }) => (
            <MetricTile
              key={title}
              icon={Icon}
              label={title}
              wert={value}
              {...(ton ? { ton } : {})}
            />
          ))}
        </MetricRow>
        <FilterBar
          werkzeuge={
            <>
              <FilterResetChip count={activeFilterCount} onReset={resetFilters} />
              <TableToolbar
                tableRef={tableRef}
                exportName="Hardware"
                columnPicker={
                  <ColumnPicker
                    columns={HARDWARE_COLUMNS}
                    visibleColumns={table.visibleColumns}
                    toggleColumn={table.toggleColumn}
                    moveColumn={table.moveColumn}
                  />
                }
              />
            </>
          }
        >
          {/* Die Seitensuche steht bei ihrer Liste; im Seitenkopf liegt die
              Suche über alle Module. */}
          <label className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Suche"
              placeholder="Empfänger, E-Mail, Telefon oder Objektnummer …"
              className="h-11 w-72 rounded-full pl-8 sm:h-8"
            />
          </label>

          <FilterTrenner />

          <Input
            placeholder="Event filtern …"
            aria-label="Event filtern"
            value={event}
            onChange={(e) => setEvent(e.target.value)}
            className="h-11 w-44 rounded-full sm:h-8"
          />
          <label className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-input bg-card px-3 text-sm text-muted-foreground md:min-h-8">
            Status
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger
                aria-label="Status filtern"
                className="h-7 border-0 bg-transparent px-1 shadow-none"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Aktive</SelectItem>
                <SelectItem value="OPEN">Offen</SelectItem>
                <SelectItem value="MAIL_SEND">Mail senden</SelectItem>
                <SelectItem value="NOTIFIED">Benachrichtigt</SelectItem>
                <SelectItem value="RETURNED">Retourniert</SelectItem>
                <SelectItem value="COMPLETED">Abgeschlossen</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <label className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-input bg-card px-3 text-sm text-muted-foreground md:min-h-8">
            Ausgabeart
            <Select value={issueType} onValueChange={setIssueType}>
              <SelectTrigger
                aria-label="Ausgabeart filtern"
                className="h-7 border-0 bg-transparent px-1 shadow-none"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Ausgabearten</SelectItem>
                <SelectItem value="PARTICIPANT">Teilnehmer</SelectItem>
                <SelectItem value="RENTAL">Verleih</SelectItem>
                <SelectItem value="OTHER">Sonstige</SelectItem>
              </SelectContent>
            </Select>
          </label>
          {/* Chip wie jeder andere Filter der Anwendung; als Ankreuzfeld fiel
              er als einziger aus der Reihe. */}
          <ToggleChip aktiv={overdue} onToggle={() => setOverdue(!overdue)}>
            Überfällig
          </ToggleChip>
        </FilterBar>

        <p className="text-sm text-muted-foreground" aria-live="polite">
          <span className="font-semibold text-foreground">Rückgabevorgänge</span> · {active.length}{" "}
          {active.length === 1 ? "aktiver Vorgang" : "aktive Vorgänge"}
        </p>

        <div>
          {inlineError && (
            <p
              className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {inlineError}
            </p>
          )}
          <div>
            <DataTable
              ref={tableRef}
              exportName="Hardware"
              tools="extern"
              className="min-w-[1100px]"
            >
              <caption className="sr-only">Aktive Hardware-Rückgabevorgänge</caption>
              <thead>
                <tr className="h-[30px] border-b text-left">
                  {table.visibleColumns.map((h) => (
                    <th className="px-2 py-1.5" key={h}>
                      <SortHeader
                        label={h}
                        active={table.sort.key === h}
                        direction={table.sort.direction}
                        onSort={() => table.sortBy(h)}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((i) => (
                  <tr
                    key={i.id}
                    data-inline-editing={inlineEditingId === i.id ? "true" : undefined}
                    aria-busy={savingInline && inlineEditingId === i.id}
                    className="h-[34px] cursor-pointer border-b transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring data-[inline-editing=true]:bg-accent/50"
                    tabIndex={0}
                    onClick={() => inlineEditingId !== i.id && beginInlineEdit(i)}
                    onKeyDown={(event) => {
                      if (inlineEditingId === i.id && event.key === "Escape") {
                        setInlineEditingId(null);
                        setInlineDraft(null);
                        return;
                      }
                      if (
                        inlineEditingId !== i.id &&
                        (event.key === "Enter" || event.key === " ")
                      ) {
                        event.preventDefault();
                        beginInlineEdit(i);
                      }
                    }}
                  >
                    {table.visibleColumns.map((h) => {
                      const editing = inlineEditingId === i.id && inlineDraft;
                      if (editing && h === "Event")
                        return (
                          <td className="px-2 py-1" key={h}>
                            <Select
                              value={inlineDraft.eventId}
                              onValueChange={(eventId) => {
                                setInlineDraft({ ...inlineDraft, eventId });
                                void saveInlineEdit(i, {
                                  eventId: eventId === "none" ? null : eventId,
                                });
                              }}
                            >
                              <SelectTrigger
                                aria-label="Event bearbeiten"
                                className="h-8 min-w-44"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Kein Event zugeordnet</SelectItem>
                                {events.map((event) => (
                                  <SelectItem key={event.id} value={event.id}>
                                    {event.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                        );
                      if (editing && h === "Empfänger")
                        return (
                          <td className="px-2 py-1" key={h}>
                            <Input
                              aria-label="Empfänger bearbeiten"
                              className="h-8 min-w-36"
                              value={inlineDraft.recipientName}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                setInlineDraft({ ...inlineDraft, recipientName: e.target.value })
                              }
                              onBlur={() =>
                                void saveInlineEdit(i, {
                                  recipientName: inlineDraft.recipientName,
                                })
                              }
                            />
                          </td>
                        );
                      if (editing && h === "E-Mail")
                        return (
                          <td className="px-2 py-1" key={h}>
                            <Input
                              aria-label="E-Mail bearbeiten"
                              aria-describedby={
                                inlineEmailError ? "hardware-email-error" : undefined
                              }
                              aria-invalid={inlineEmailError ? "true" : undefined}
                              className="h-8 min-w-48"
                              type="email"
                              value={inlineDraft.email ?? ""}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                setInlineEmailError(null);
                                setInlineDraft({ ...inlineDraft, email: e.target.value });
                              }}
                              onBlur={() => {
                                const email = inlineDraft.email?.trim() ?? "";
                                if (!validEmail(email)) {
                                  setInlineEmailError("Bitte eine gültige E-Mail-Adresse angeben.");
                                  return;
                                }
                                setInlineEmailError(null);
                                void saveInlineEdit(i, { email: email || null });
                              }}
                            />
                            {inlineEmailError && (
                              <p
                                id="hardware-email-error"
                                className="mt-1 text-xs text-destructive"
                                role="alert"
                              >
                                {inlineEmailError}
                              </p>
                            )}
                          </td>
                        );
                      if (editing && h === "Telefon")
                        return (
                          <td className="px-2 py-1" key={h}>
                            <Input
                              aria-label="Telefon bearbeiten"
                              className="h-8 min-w-36"
                              type="tel"
                              value={inlineDraft.phone ?? ""}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                setInlineDraft({ ...inlineDraft, phone: e.target.value })
                              }
                              onBlur={() =>
                                void saveInlineEdit(i, { phone: inlineDraft.phone ?? null })
                              }
                            />
                          </td>
                        );
                      if (editing && h === "Art")
                        return (
                          <td className="px-2 py-1" key={h}>
                            <Select
                              value={inlineDraft.issueType}
                              onValueChange={(issueType) => {
                                setInlineDraft({ ...inlineDraft, issueType });
                                void saveInlineEdit(i, { issueType });
                              }}
                            >
                              <SelectTrigger
                                aria-label="Art bearbeiten"
                                className="h-8 min-w-32"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(labels)
                                  .slice(5)
                                  .map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                      {label}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </td>
                        );
                      if (editing && h === "Objekt")
                        return (
                          <td className="px-2 py-1" key={h}>
                            <Select
                              value={inlineDraft.objectName}
                              onValueChange={(objectName) => {
                                setInlineDraft({ ...inlineDraft, objectName });
                                void saveInlineEdit(i, { objectName });
                              }}
                            >
                              <SelectTrigger
                                aria-label="Objekt bearbeiten"
                                className="h-8 min-w-56"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {!hardwareObjectNames.includes(inlineDraft.objectName) && (
                                  <SelectItem value={inlineDraft.objectName}>
                                    {inlineDraft.objectName}
                                  </SelectItem>
                                )}
                                {hardwareObjectNames.map((objectName) => (
                                  <SelectItem key={objectName} value={objectName}>
                                    {objectName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                        );
                      if (editing && h === "Nummer")
                        return (
                          <td className="px-2 py-1" key={h}>
                            <Input
                              aria-label="Nummer bearbeiten"
                              className="h-8 min-w-32"
                              value={inlineDraft.objectNumber}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                setInlineDraft({ ...inlineDraft, objectNumber: e.target.value })
                              }
                              onBlur={(event) =>
                                void saveInlineEdit(
                                  i,
                                  objectNumberChanges(event.currentTarget.value),
                                )
                              }
                            />
                          </td>
                        );
                      if (editing && h === "Anzahl")
                        return (
                          <td className="px-2 py-1" key={h}>
                            <Input
                              aria-label="Anzahl bearbeiten"
                              className="h-8 w-20"
                              type="number"
                              min="1"
                              value={inlineDraft.quantity}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                setInlineDraft({
                                  ...inlineDraft,
                                  quantity: Number(e.target.value),
                                })
                              }
                              onBlur={() =>
                                void saveInlineEdit(i, { quantity: inlineDraft.quantity })
                              }
                            />
                          </td>
                        );
                      if (editing && h === "Status")
                        return (
                          <td className="px-2 py-1" key={h}>
                            <Select
                              value={inlineDraft.status}
                              onValueChange={(status) => {
                                setInlineDraft({ ...inlineDraft, status });
                                void saveInlineEdit(i, { status });
                              }}
                            >
                              <SelectTrigger
                                aria-label="Status bearbeiten"
                                className="h-8 min-w-32"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(labels)
                                  .slice(0, 5)
                                  .map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                      {label}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </td>
                        );
                      if (editing && h === "Fälligkeit")
                        return (
                          <td className="px-2 py-1" key={h}>
                            <Input
                              aria-label="Fälligkeit bearbeiten"
                              className="h-8 min-w-32"
                              type="date"
                              value={inlineDraft.dueDate ?? ""}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                setInlineDraft({
                                  ...inlineDraft,
                                  dueDate: e.target.value || undefined,
                                })
                              }
                              onBlur={() =>
                                void saveInlineEdit(i, { dueDate: inlineDraft.dueDate ?? null })
                              }
                            />
                          </td>
                        );
                      if (editing && h === "Kommentar")
                        return (
                          <td className="px-2 py-1" key={h}>
                            <Input
                              aria-label="Kommentar bearbeiten"
                              className="h-8 min-w-56"
                              value={inlineDraft.note ?? ""}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                setInlineDraft({ ...inlineDraft, note: e.target.value })
                              }
                              onBlur={() =>
                                void saveInlineEdit(i, { note: inlineDraft.note ?? null })
                              }
                            />
                          </td>
                        );
                      return (
                        <td className="px-2 py-1" key={h}>
                          {cell(i, h, today)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td
                      colSpan={table.visibleColumns.length}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      Keine Hardware-Vorgänge entsprechen den aktuellen Filtern.
                    </td>
                  </tr>
                )}
              </tbody>
            </DataTable>
          </div>
        </div>
      </div>
    </div>
  );
}
