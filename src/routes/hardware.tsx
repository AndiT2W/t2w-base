import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { normalizeHardwareResponse } from "@/lib/t2w/hardware-response";
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
  event: { id?: string; eventCode: string; name: string } | null;
};
type InlineDraft = Pick<
  Hardware,
  "recipientName" | "objectName" | "quantity" | "status" | "dueDate"
>;
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
function cell(item: Hardware, column: HardwareColumn): ReactNode {
  if (column === "Event")
    return item.event ? (
      <Link
        className="text-primary hover:underline"
        to="/events/$eventcode"
        params={{ eventcode: item.event.eventCode }}
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
    };
    return values[key];
  },
})) as unknown as readonly {
  key: HardwareColumn;
  sortValue: (item: Hardware) => string | number;
}[];
export const Route = createFileRoute("/hardware")({ component: HardwarePage });
function HardwarePage() {
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
  const [newHardware, setNewHardware] = useState(false);
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
  const today = new Date().toISOString().slice(0, 10);
  const active = items.filter(
    (i) =>
      (!q ||
        [i.recipientName, i.email, i.phone, i.objectName, number(i), i.event?.name]
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
  const beginInlineEdit = (item: Hardware) => {
    setInlineError(null);
    setInlineEditingId(item.id);
    setInlineDraft({
      recipientName: item.recipientName,
      objectName: item.objectName,
      quantity: item.quantity,
      status: item.status,
      dueDate: item.dueDate?.slice(0, 10),
    });
  };
  const saveInlineEdit = async (item: Hardware) => {
    if (!item.event?.id || !inlineDraft) return;
    setSavingInline(true);
    try {
      const response = await fetch(`/api/v1/events/${item.event.id}/hardware/${item.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inlineDraft),
      });
      if (!response.ok) {
        setInlineError("Änderungen konnten nicht gespeichert werden. Bitte erneut versuchen.");
        return;
      }
      const updated = (await response.json()) as Hardware;
      setItems((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
      setInlineEditingId(null);
      setInlineDraft(null);
    } finally {
      setSavingInline(false);
    }
  };
  return (
    <div>
      <PageHeader
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
                    <th className="px-2 py-1.5">
                      <span className="sr-only">Aktionen</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((i) => (
                    <tr key={i.id} className="border-b hover:bg-accent/50">
                      {HARDWARE_COLUMNS.filter((h) => table.visibleColumns.includes(h)).map((h) => {
                        const editing = inlineEditingId === i.id && inlineDraft;
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
                              />
                            </td>
                          );
                        if (editing && h === "Objekt")
                          return (
                            <td className="px-2 py-1" key={h}>
                              <Input
                                aria-label="Objekt bearbeiten"
                                className="h-8 min-w-36"
                                value={inlineDraft.objectName}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) =>
                                  setInlineDraft({ ...inlineDraft, objectName: e.target.value })
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
                              />
                            </td>
                          );
                        if (editing && h === "Status")
                          return (
                            <td className="px-2 py-1" key={h}>
                              <Select
                                value={inlineDraft.status}
                                onValueChange={(status) =>
                                  setInlineDraft({ ...inlineDraft, status })
                                }
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
                              />
                            </td>
                          );
                        return (
                          <td className="px-2 py-1" key={h}>
                            {cell(i, h)}
                          </td>
                        );
                      })}
                      <td
                        className="whitespace-nowrap px-2 py-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {inlineEditingId === i.id ? (
                          <span className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => void saveInlineEdit(i)}
                              disabled={savingInline || !i.event?.id}
                            >
                              Speichern
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setInlineEditingId(null);
                                setInlineDraft(null);
                              }}
                            >
                              Abbrechen
                            </Button>
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => beginInlineEdit(i)}
                            disabled={!i.event?.id}
                          >
                            Inline bearbeiten
                          </Button>
                        )}
                      </td>
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
