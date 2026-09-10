import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { hardwareLifecycle } from "@/lib/t2w/hardware-lifecycle";
import { useT2W } from "@/lib/t2w/store";

type Item = {
  id: string;
  recipientName: string;
  issueType: string;
  objectName: string;
  objectNumberType: string;
  objectNumberSingle?: string;
  objectNumberPrefix?: string;
  objectNumberFrom?: number;
  objectNumberTo?: number;
  objectNumberPadding?: number;
  quantity: number;
  status: string;
  email?: string;
  phone?: string;
  dueDate?: string;
  issuedAt?: string;
  note?: string;
  event?: { eventCode: string; name: string };
};
const statusLabels: Record<string, string> = {
  OPEN: "Offen",
  MAIL_SEND: "Mail senden",
  NOTIFIED: "Benachrichtigt",
  RETURNED: "Retourniert",
  COMPLETED: "Abgeschlossen",
};
const issueLabels: Record<string, string> = {
  PARTICIPANT: "Teilnehmer",
  RENTAL: "Verleih",
  OTHER: "Sonstige",
};
const validEmail = (value: string) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
function displayNumber(item: Item) {
  if (item.objectNumberSingle) return item.objectNumberSingle;
  if (item.objectNumberPrefix && item.objectNumberFrom != null && item.objectNumberTo != null) {
    const padding = item.objectNumberPadding ?? 3;
    return `${item.objectNumberPrefix}${String(item.objectNumberFrom).padStart(padding, "0")}–${item.objectNumberPrefix}${String(item.objectNumberTo).padStart(padding, "0")}`;
  }
  return "—";
}
export function HardwareWorkspace({
  eventId,
  initialEditing,
  onSaved,
  showList = true,
  createOnMount = false,
}: {
  eventId?: string;
  initialEditing?: Partial<Item> | null;
  onSaved?: (item: Item) => void;
  showList?: boolean;
  createOnMount?: boolean;
}) {
  const { selectionLists } = useT2W();
  const [items, setItems] = useState<Item[]>([]);
  const [editing, setEditing] = useState<Partial<Item> | null>(() =>
    createOnMount ? { objectNumberType: "NONE", issueType: "PARTICIPANT", quantity: 1 } : null,
  );
  const [emailError, setEmailError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const hardwareObjectNames = selectionLists.hardwareObjects
    .filter((value) => value.active || value.name === editing?.objectName)
    .map((value) => value.name);
  const load = () =>
    hardwareLifecycle
      .list<Item>(eventId ? { eventId } : {})
      .then(setItems)
      .catch(() => setItems([]));
  useEffect(() => {
    void load();
    // The loader is scoped to the current event.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);
  useEffect(() => {
    if (initialEditing) setEditing(initialEditing);
  }, [initialEditing]);
  const save = async () => {
    if (!editing) return;
    const email = editing.email?.trim() ?? "";
    if (!validEmail(email)) {
      setEmailError("Bitte eine gültige E-Mail-Adresse angeben.");
      return;
    }
    const payload = {
      recipientName: editing.recipientName ?? "",
      issueType: editing.issueType ?? "PARTICIPANT",
      objectName: editing.objectName ?? "",
      objectNumberType: editing.objectNumberType ?? "NONE",
      objectNumberSingle: editing.objectNumberSingle,
      objectNumberPrefix: editing.objectNumberPrefix,
      objectNumberFrom:
        editing.objectNumberFrom == null ? undefined : Number(editing.objectNumberFrom),
      objectNumberTo: editing.objectNumberTo == null ? undefined : Number(editing.objectNumberTo),
      objectNumberPadding:
        editing.objectNumberPadding == null ? undefined : Number(editing.objectNumberPadding),
      quantity: editing.quantity == null ? 1 : Number(editing.quantity),
      email: email || undefined,
      phone: editing.phone,
      dueDate: editing.dueDate || undefined,
      issuedAt: editing.issuedAt || undefined,
      note: editing.note,
    };
    setSaving(true);
    setSaveError(null);
    try {
      const saved = await hardwareLifecycle.save<Item>(eventId ? { eventId } : {}, {
        ...payload,
        id: editing.id,
      });
      setEditing(null);
      await load();
      if (saved) onSaved?.(saved);
    } catch {
      setSaveError("Die Hardware-Ausgabe konnte nicht gespeichert werden. Bitte erneut versuchen.");
    } finally {
      setSaving(false);
    }
  };
  const remove = async (id: string) => {
    await hardwareLifecycle.remove(eventId ? { eventId } : {}, id);
    await load();
  };
  return (
    <div className="space-y-3">
      {!initialEditing && (
        <div className="flex justify-end">
          <Button
            onClick={() =>
              setEditing({ objectNumberType: "NONE", issueType: "PARTICIPANT", quantity: 1 })
            }
          >
            Hardware-Ausgabe anlegen
          </Button>
        </div>
      )}
      {editing && (
        <div className="grid gap-2 rounded-md border p-3 sm:grid-cols-3">
          <Input
            placeholder="Empfänger"
            aria-label="Empfänger"
            value={editing.recipientName ?? ""}
            onChange={(e) => setEditing({ ...editing, recipientName: e.target.value })}
          />
          <Input
            placeholder="E-Mail"
            aria-label="E-Mail"
            aria-describedby={emailError ? "hardware-form-email-error" : undefined}
            aria-invalid={emailError ? "true" : undefined}
            type="email"
            value={editing.email ?? ""}
            onChange={(e) => {
              setEmailError(null);
              setEditing({ ...editing, email: e.target.value });
            }}
            onBlur={() => {
              const email = editing.email?.trim() ?? "";
              setEmailError(
                validEmail(email) ? null : "Bitte eine gültige E-Mail-Adresse angeben.",
              );
            }}
          />
          {emailError && (
            <p
              id="hardware-form-email-error"
              className="text-xs text-destructive sm:col-span-3"
              role="alert"
            >
              {emailError}
            </p>
          )}
          <Input
            placeholder="Telefon"
            aria-label="Telefon"
            value={editing.phone ?? ""}
            onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
          />
          <Select
            value={editing.objectName ?? ""}
            onValueChange={(objectName) => setEditing({ ...editing, objectName })}
          >
            <SelectTrigger aria-label="Objekt">
              <SelectValue placeholder="Objekt auswählen" />
            </SelectTrigger>
            <SelectContent>
              {hardwareObjectNames.map((objectName) => (
                <SelectItem key={objectName} value={objectName}>
                  {objectName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Notiz"
            aria-label="Notiz"
            value={editing.note ?? ""}
            onChange={(e) => setEditing({ ...editing, note: e.target.value })}
          />
          <Input
            type="date"
            aria-label="Ausgabedatum"
            value={editing.issuedAt?.slice(0, 10) ?? ""}
            onChange={(e) => setEditing({ ...editing, issuedAt: e.target.value })}
          />
          <Select
            value={editing.issueType ?? "PARTICIPANT"}
            onValueChange={(v) => setEditing({ ...editing, issueType: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Ausgabeart" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(issueLabels).map(([v, l]) => (
                <SelectItem key={v} value={v}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={editing.objectNumberType ?? "NONE"}
            onValueChange={(v) => setEditing({ ...editing, objectNumberType: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Nummerntyp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">Keine Nummer</SelectItem>
              <SelectItem value="SINGLE">Einzelgerät</SelectItem>
              <SelectItem value="RANGE">Range</SelectItem>
            </SelectContent>
          </Select>
          {editing.objectNumberType === "SINGLE" && (
            <Input
              placeholder="Objektnummer"
              value={editing.objectNumberSingle ?? ""}
              onChange={(e) => setEditing({ ...editing, objectNumberSingle: e.target.value })}
            />
          )}
          {editing.objectNumberType === "RANGE" && (
            <>
              <Input
                placeholder="Prefix"
                value={editing.objectNumberPrefix ?? ""}
                onChange={(e) => setEditing({ ...editing, objectNumberPrefix: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Von"
                value={editing.objectNumberFrom ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, objectNumberFrom: Number(e.target.value) })
                }
              />
              <Input
                type="number"
                placeholder="Bis"
                value={editing.objectNumberTo ?? ""}
                onChange={(e) => setEditing({ ...editing, objectNumberTo: Number(e.target.value) })}
              />
              <Input
                type="number"
                placeholder="Padding"
                value={editing.objectNumberPadding ?? 3}
                onChange={(e) =>
                  setEditing({ ...editing, objectNumberPadding: Number(e.target.value) })
                }
              />
            </>
          )}
          <Input
            type="number"
            placeholder="Anzahl"
            value={editing.quantity ?? 1}
            onChange={(e) => setEditing({ ...editing, quantity: Number(e.target.value) })}
          />
          <Input
            type="date"
            value={editing.dueDate?.slice(0, 10) ?? ""}
            onChange={(e) => setEditing({ ...editing, dueDate: e.target.value })}
          />
          {editing.id && (
            <Select
              value={editing.status ?? "OPEN"}
              onValueChange={(v) => setEditing({ ...editing, status: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusLabels).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="flex gap-2 sm:col-span-3">
            {saveError && (
              <p className="text-sm text-destructive" role="alert">
                {saveError}
              </p>
            )}
            <Button disabled={saving} onClick={() => void save()}>
              {saving ? "Speichert …" : "Speichern"}
            </Button>
            <Button disabled={saving} variant="outline" onClick={() => setEditing(null)}>
              Abbrechen
            </Button>
          </div>
        </div>
      )}
      {showList && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                {[
                  "Empfänger",
                  "Art",
                  "Objekt",
                  "Nummer",
                  "Anzahl",
                  "Status",
                  "Due Date",
                  "Aktionen",
                ].map((h) => (
                  <th className="p-2" key={h}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr className="border-b" key={item.id}>
                  <td className="p-2">{item.recipientName}</td>
                  <td className="p-2">{issueLabels[item.issueType] ?? item.issueType}</td>
                  <td className="p-2">{item.objectName}</td>
                  <td className="p-2 font-mono">{displayNumber(item)}</td>
                  <td className="p-2">{item.quantity}</td>
                  <td className="p-2">
                    <Badge>{statusLabels[item.status] ?? item.status}</Badge>
                  </td>
                  <td
                    className={`p-2 ${item.dueDate && item.dueDate.slice(0, 10) < new Date().toISOString().slice(0, 10) && item.status !== "RETURNED" && item.status !== "COMPLETED" ? "font-semibold text-destructive" : ""}`}
                  >
                    {item.dueDate?.slice(0, 10) ?? "—"}
                  </td>
                  <td className="flex gap-1 p-2">
                    <Button size="sm" variant="outline" onClick={() => setEditing(item)}>
                      Bearbeiten
                    </Button>
                    {item.status !== "RETURNED" && item.status !== "COMPLETED" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            void fetch(`/api/v1/events/${eventId}/hardware/${item.id}`, {
                              method: "PATCH",
                              credentials: "include",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ status: "RETURNED" }),
                            }).then(load);
                          }}
                        >
                          Retourniert
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => void remove(item.id)}>
                          Löschen
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
