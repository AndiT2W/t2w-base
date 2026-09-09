import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { normalizeHardwareResponse } from "@/lib/t2w/hardware-response";
import { useT2W } from "@/lib/t2w/store";
import { HardwareWorkspace } from "@/components/t2w/HardwareWorkspace";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/t2w/PageHeader";
import { ColumnPicker, SortHeader, useTableBehavior } from "@/components/t2w/TableFeatures";
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
type InlineDraft = Pick<
  Hardware,
  | "recipientName"
  | "email"
  | "phone"
  | "issueType"
  | "objectName"
  | "quantity"
  | "status"
  | "dueDate"
  | "note"
> & { eventId: string; objectNumber: string };
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
      objectNumberPadding: range[2].length,
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
function cell(item: Hardware, column: HardwareColumn): ReactNode {
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
  if (column === "Status") return <Badge>{labels[item.status] ?? item.status}</Badge>;
  if (column === "Kommentar") return item.note ?? "—";
  return item.dueDate?.slice(0, 10) ?? "—";
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
  const [selectedEventId, setSelectedEventId] = useState("");
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineDraft, setInlineDraft] = useState<InlineDraft | null>(null);
  const [savingInline, setSavingInline] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [inlineEmailError, setInlineEmailError] = useState<string | null>(null);
  const [newHardware, setNewHardware] = useState(false);
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
  useEffect(() => {
    const params = new URLSearchParams({ q });
    if (status !== "active") params.set("status", status);
    if (issueType !== "all") params.set("issueType", issueType);
    fetch(`/api/v1/events/hardware?${params}`, { credentials: "include" })
      .then((r) => r.json())
      .then((value) => setItems(normalizeHardwareResponse<Hardware>(value)))
      .catch(() => setItems([]));
  }, [q, status, issueType]);
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
      setInlineEditingId(null);
      setInlineDraft(null);
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
      (!overdue ||
        Boolean(
          i.dueDate &&
          i.dueDate.slice(0, 10) < today &&
          i.status !== "RETURNED" &&
          i.status !== "COMPLETED",
        )),
  );
  const rows = useMemo(() => table.rows(active), [active, table]);
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
      const baseUrl = item.event?.id
        ? `/api/v1/events/${item.event.id}/hardware`
        : "/api/v1/events/hardware";
      const response = await fetch(`${baseUrl}/${item.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      if (!response.ok) {
        setInlineError("Änderungen konnten nicht gespeichert werden. Bitte erneut versuchen.");
        return;
      }
      const updated = (await response.json()) as Hardware;
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
  return (
    <div>
      <PageHeader
        krumen={[{ label: "TIME2WIN", to: "/" }]}
        titel="Hardware"
        beschreibung="Eventübergreifende Rückgabeübersicht"
        suche={{
          value: q,
          onChange: setQ,
          placeholder: "Empfänger, E-Mail, Telefon oder Objektnummer …",
        }}
        aktion={<Button onClick={() => setNewHardware(true)}>Hardware-Ausgabe anlegen</Button>}
      />
      <div className="space-y-6">
        <Sheet open={newHardware} onOpenChange={setNewHardware}>
          <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
            <SheetHeader>
              <SheetTitle>Hardware-Ausgabe anlegen</SheetTitle>
              <SheetDescription>Neue Ausgabe für ein Event erfassen.</SheetDescription>
            </SheetHeader>
            <div className="mt-5 space-y-4">
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger>
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
              {selectedEventId && (
                <HardwareWorkspace
                  eventId={selectedEventId}
                  onSaved={() => setNewHardware(false)}
                  showList={false}
                />
              )}
            </div>
          </SheetContent>
        </Sheet>
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            ["Offen", active.filter((i) => i.status === "OPEN").length],
            ["Benachrichtigt", active.filter((i) => i.status === "NOTIFIED").length],
            ["Verleih", active.filter((i) => i.issueType === "RENTAL").length],
            ["Gesamt aktiv", active.length],
          ].map(([title, value]) => (
            <Card key={String(title)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{title}</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">{value}</CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <div className="mt-3 grid gap-2 sm:grid-cols-4">
              <Input
                placeholder="Event filtern …"
                value={event}
                onChange={(e) => setEvent(e.target.value)}
              />
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
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
              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Ausgabearten</SelectItem>
                  <SelectItem value="PARTICIPANT">Teilnehmer</SelectItem>
                  <SelectItem value="RENTAL">Verleih</SelectItem>
                  <SelectItem value="OTHER">Sonstige</SelectItem>
                </SelectContent>
              </Select>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={overdue}
                  onChange={(e) => setOverdue(e.target.checked)}
                />{" "}
                Überfällig
              </label>
              <ColumnPicker
                columns={HARDWARE_COLUMNS}
                visibleColumns={table.visibleColumns}
                toggleColumn={table.toggleColumn}
              />
            </div>
          </CardHeader>
          <CardContent>
            {inlineError && (
              <p
                className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {inlineError}
              </p>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    {HARDWARE_COLUMNS.filter((h) => table.visibleColumns.includes(h)).map((h) => (
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
                      className="cursor-pointer border-b hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                      {HARDWARE_COLUMNS.filter((h) => table.visibleColumns.includes(h)).map((h) => {
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
                                    setInlineEmailError(
                                      "Bitte eine gültige E-Mail-Adresse angeben.",
                                    );
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
                                onBlur={() =>
                                  void saveInlineEdit(
                                    i,
                                    objectNumberChanges(inlineDraft.objectNumber),
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
                            {cell(i, h)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
