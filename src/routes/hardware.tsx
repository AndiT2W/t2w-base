import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  event: { eventCode: string; name: string };
};
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
export const Route = createFileRoute("/hardware")({ component: HardwarePage });
function HardwarePage() {
  const [items, setItems] = useState<Hardware[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("active");
  const [issueType, setIssueType] = useState("all");
  const [event, setEvent] = useState("");
  const [overdue, setOverdue] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams({ q });
    if (status !== "active") params.set("status", status);
    if (issueType !== "all") params.set("issueType", issueType);
    fetch(`/api/v1/events/hardware?${params}`, { credentials: "include" })
      .then((r) => r.json())
      .then(setItems)
      .catch(() => setItems([]));
  }, [q, status, issueType]);
  const today = new Date().toISOString().slice(0, 10);
  const active = items.filter(
    (i) =>
      (status !== "active" || (i.status !== "RETURNED" && i.status !== "COMPLETED")) &&
      (!event || i.event.name.toLowerCase().includes(event.toLowerCase())) &&
      (!overdue ||
        Boolean(
          i.dueDate &&
          i.dueDate.slice(0, 10) < today &&
          i.status !== "RETURNED" &&
          i.status !== "COMPLETED",
        )),
  );
  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-semibold">Hardware</h1>
        <p className="text-sm text-muted-foreground">Eventübergreifende Rückgabeübersicht</p>
      </div>
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
          <Input
            placeholder="Empfänger, E-Mail oder Objektnummer suchen …"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
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
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  {[
                    "Event",
                    "Empfänger",
                    "Art",
                    "Objekt",
                    "Nummer",
                    "Anzahl",
                    "Status",
                    "Due Date",
                  ].map((h) => (
                    <th className="p-2" key={h}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {active.map((i) => (
                  <tr key={i.id} className="border-b">
                    <td className="p-2">
                      <Link
                        className="text-primary hover:underline"
                        to="/events/$eventcode"
                        params={{ eventcode: i.event.eventCode }}
                      >
                        {i.event.name}
                      </Link>
                    </td>
                    <td className="p-2">{i.recipientName}</td>
                    <td className="p-2">{labels[i.issueType] ?? i.issueType}</td>
                    <td className="p-2">{i.objectName}</td>
                    <td className="p-2 font-mono">{number(i)}</td>
                    <td className="p-2">{i.quantity}</td>
                    <td className="p-2">
                      <Badge>{labels[i.status] ?? i.status}</Badge>
                    </td>
                    <td className="p-2">{i.dueDate?.slice(0, 10) ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
