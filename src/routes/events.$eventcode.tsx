import { useEffect, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, FolderSync, Link2, Mail, Phone, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useI18n } from "@/lib/i18n";
import { formatDatum, formatZeitraum, heuteIso } from "@/lib/t2w/format";
import { jahr } from "@/lib/t2w/eventcode";
import type { OutlookFolderPlan } from "@/lib/t2w/event-workspace";
import { STATUS_LABEL, STATUS_ORDER, type EventStatus, type T2WEvent } from "@/lib/t2w/types";
import type { Kunde } from "@/lib/crm/types";

function RecipientMasterData({ recipient }: { recipient: Kunde }) {
  const address = [recipient.strasse, [recipient.plz, recipient.ort].filter(Boolean).join(" "), recipient.land]
    .filter(Boolean)
    .join(", ");
  return <dl className="grid gap-x-5 gap-y-2 rounded-md border border-border bg-muted/30 p-3 text-sm sm:grid-cols-2"><div><dt className="text-xs text-muted-foreground">Name</dt><dd><a className="text-primary hover:underline" href={`/kontakte?kunde=${encodeURIComponent(recipient.id)}`}>{recipient.name}</a></dd></div><div><dt className="text-xs text-muted-foreground">Adresse</dt><dd>{address || "—"}</dd></div><div><dt className="text-xs text-muted-foreground">UID</dt><dd>{recipient.uid || "—"}</dd></div><div><dt className="text-xs text-muted-foreground">IBAN</dt><dd>{recipient.iban || "—"}</dd></div><div><dt className="text-xs text-muted-foreground">BIC</dt><dd>{recipient.bic || "—"}</dd></div></dl>;
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
  const { updateEvent, syncOutlookFolder, getOutlookFolderPlan, settings, addEventContact: persistContact, removeEventContact, updateEventContactRole: persistContactRole, createEventTask, updateEventTask, createEventFile, createEventActivity } = useT2W();
  const { personen, kunden, kontakteVonKunde, neuLaden } = useCrm();
  const { t } = useI18n();
  const [outlookSyncing, setOutlookSyncing] = useState(false);
  const [outlookSyncMessage, setOutlookSyncMessage] = useState<string | null>(null);
  const [form, setForm] = useState(event);
  const [quartalsDialog, setQuartalsDialog] = useState(false);
  const [outlookPlan, setOutlookPlan] = useState<OutlookFolderPlan | null>(null);
  const [contactId, setContactId] = useState("");
  const [contactRole, setContactRole] = useState("Kontakt");
  const [contactSearch, setContactSearch] = useState("");
  const [invoiceRecipientSearch, setInvoiceRecipientSearch] = useState("");
  const [newTask, setNewTask] = useState("");
  const [newFile, setNewFile] = useState("");
  const [newActivity, setNewActivity] = useState("");

  useEffect(() => setForm(event), [event]);
  useEffect(() => {
    void getOutlookFolderPlan(event.id)
      .then(setOutlookPlan)
      .catch(() => setOutlookPlan(null));
  }, [event.id, event.start, event.outlookOrdner, getOutlookFolderPlan]);

  const vergangen = event.ende < heuteIso();
  const outlookVorschlag = outlookPlan?.path ?? form.outlookOrdner ?? "";
  const quartalsAbweichung = outlookPlan?.drifted ?? false;
  const jahresSite = settings.jahresSites.find((s) => s.jahr === jahr(form.start));
  const sharepointLink =
    form.sharepointOrdner && jahresSite
      ? `${jahresSite.url.replace(/\/$/, "")}/${form.sharepointOrdner.split("/").map(encodeURIComponent).join("/")}`
      : null;
  const veranstalterKontakte = event.veranstalterId ? kontakteVonKunde(event.veranstalterId) : [];
  const sichtbareKontakte = personen.filter((person) => {
    if (form.kontakte.some((item) => item.id === person.id)) return false;
    const query = contactSearch.trim().toLocaleLowerCase("de");
    return !query || `${person.vorname} ${person.nachname} ${person.email}`.toLocaleLowerCase("de").includes(query);
  });
  const auszahlungsempfaengerId = form.auszahlungsempfaengerId ?? event.veranstalterId;
  const auszahlungsempfaenger = kunden.find((kunde) => kunde.id === auszahlungsempfaengerId);
  const rechnungsempfaengerIds = form.rechnungsempfaengerIds ?? (event.veranstalterId ? [event.veranstalterId] : []);
  const rechnungsempfaenger = kunden.filter((kunde) => rechnungsempfaengerIds.includes(kunde.id));
  const sichtbareRechnungsempfaenger = kunden.filter((kunde) =>
    kunde.name.toLocaleLowerCase("de").includes(invoiceRecipientSearch.trim().toLocaleLowerCase("de")),
  );

  function set<K extends keyof T2WEvent>(key: K, wert: T2WEvent[K]) {
    setForm((p) => ({ ...p, [key]: wert }));
  }

  async function speichern() {
    if (!form.start) {
      toast.error("Das Startdatum ist verpflichtend.");
      return;
    }
    const organizerChanged = form.veranstalterId !== event.veranstalterId;
    const nextForm = organizerChanged && form.veranstalterId
      ? { ...form, auszahlungsempfaengerId: form.veranstalterId, rechnungsempfaengerIds: [form.veranstalterId] }
      : form;
    const result = await updateEvent(event.id, nextForm);
    if (result.kind === "saved") {
      setForm(result.event);
      await neuLaden();
      toast.success("Änderungen gespeichert.");
    } else if (result.kind === "conflict")
      toast.error("Das Event wurde zwischenzeitlich geändert. Bitte neu laden.");
    else toast.error("Änderungen konnten nicht gespeichert werden.");
  }

  async function outlookSynchronisieren() {
    setOutlookSyncing(true);
    setOutlookSyncMessage(null);
    try {
      const result = await syncOutlookFolder(event.id);
      if (result.kind !== "synced") throw result.error;
      setForm(result.event);
      setOutlookSyncMessage("Outlook-Ordner synchronisiert.");
      toast.success("Outlook-Ordner synchronisiert.");
    } catch {
      setOutlookSyncMessage("Outlook-Ordner konnte nicht synchronisiert werden.");
      toast.error("Outlook-Ordner konnte nicht synchronisiert werden.");
    } finally {
      setOutlookSyncing(false);
    }
  }
  function toggleRechnungsempfaenger(id: string) {
    set("rechnungsempfaengerIds", rechnungsempfaengerIds.includes(id)
      ? rechnungsempfaengerIds.filter((recipientId) => recipientId !== id)
      : [...rechnungsempfaengerIds, id]);
  }
  async function addEventContact(personId: string, role: string) {
    const person = personen.find((item) => item.id === personId);
    if (!person) return;
    const result = await persistContact(event.id, personId, role);
    if (result.kind !== "saved") throw new Error("EVENT_CONTACT_SAVE_FAILED");
    setForm(result.event);
  }
  async function addContact() {
    if (!contactId) return;
    await addEventContact(contactId, contactRole);
    setContactId(""); toast.success("Kontaktrolle gespeichert.");
  }
  async function updateContactRole(contact: T2WEvent["kontakte"][number], role: string) {
    const nextRole = role.trim() || "Kontakt";
    if (nextRole === contact.rolle) return;
    const result = await persistContactRole(event.id, contact.id, contact.rolle, nextRole);
    if (result.kind !== "saved") throw new Error("EVENT_CONTACT_SAVE_FAILED");
    setForm(result.event);
    toast.success("Eventrolle gespeichert.");
  }
  async function addTask() {
    if (!newTask.trim()) return;
    const result = await createEventTask(event.id, { title: newTask });
    if (result.kind !== "saved") throw new Error("EVENT_TASK_SAVE_FAILED");
    setForm(result.event); setNewTask(""); toast.success("Aufgabe angelegt.");
  }
  async function addFile() {
    if (!newFile.trim()) return;
    const result = await createEventFile(event.id, { name: newFile });
    if (result.kind !== "saved") throw new Error("EVENT_FILE_SAVE_FAILED");
    setForm(result.event); setNewFile(""); toast.success("Dateiverknüpfung gespeichert.");
  }
  async function addActivity() {
    if (!newActivity.trim()) return;
    const result = await createEventActivity(event.id, { channel: "Notiz", subject: newActivity });
    if (result.kind !== "saved") throw new Error("EVENT_ACTIVITY_SAVE_FAILED");
    setForm(result.event); setNewActivity(""); toast.success("Aktivität angelegt.");
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
        <Button onClick={speichern}>Änderungen speichern</Button>
      </div>

      {quartalsAbweichung && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-accent px-4 py-3">
          <p className="text-sm text-accent-foreground">
            Quartalswechsel erkannt: Der Outlook-Ordner liegt nicht in {outlookPlan?.quarter}.
            Vorschlag: <span className="font-mono">{outlookVorschlag}</span>. SharePoint bleibt
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
                <Select value={form.veranstalterId} onValueChange={(id) => { const customer = kunden.find((item) => item.id === id); if (customer) { set("veranstalterId", customer.id); set("veranstalter", customer.name); } }}><SelectTrigger aria-label="Veranstalter aus Stammdaten" className="mt-1.5"><SelectValue placeholder="Kunde aus Stammdaten auswählen" /></SelectTrigger><SelectContent>{kunden.map((customer) => <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>)}</SelectContent></Select>
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
              <div><Label htmlFor="d-resp">Hauptverantwortlich</Label><Input id="d-resp" value={form.verantwortlicher} onChange={(e) => set("verantwortlicher", e.target.value)} className="mt-1.5" /></div>
              <div><Label htmlFor="d-forecast">Teilnehmerprognose</Label><Input id="d-forecast" type="number" min="0" value={form.teilnehmerwerte?.prognose ?? form.teilnehmer} onChange={(e) => set("teilnehmerwerte", { ...(form.teilnehmerwerte ?? { aktuell: null, aktuellQuelle: null, aktuellSynchronisiertAm: null }), prognose: e.target.value === "" ? null : Number(e.target.value) })} className="mt-1.5" /></div>
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
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <FolderLink
                    label="Outlook"
                    href={form.outlookWebUrl}
                    available={Boolean(form.outlookWebUrl)}
                  >
                    {form.outlookOrdner}
                  </FolderLink>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={outlookSyncing || !settings.outlookMailbox}
                    onClick={() => void outlookSynchronisieren()}
                  >
                    {outlookSyncing ? "Synchronisiere …" : "Outlook-Ordner synchronisieren"}
                  </Button>
                  {outlookSyncMessage && <span role="status">{outlookSyncMessage}</span>}
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
                    href={sharepointLink}
                    available={Boolean(form.sharepointOrdner)}
                  >
                    {form.sharepointOrdner}
                  </FolderLink>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time2win"><Card><CardHeader><CardTitle className="text-base">TIME2WIN</CardTitle><CardDescription>Lokale Prognose bleibt vom synchronisierten Teilnehmerstand getrennt.</CardDescription></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="d-t2w">Event Id</Label><Input id="d-t2w" type="number" value={form.t2wEventId ?? ""} onChange={(e) => set("t2wEventId", e.target.value === "" ? null : Number(e.target.value))} className="mt-1.5" /></div><div className="text-sm"><p>Gemeldete TN: <strong>{form.teilnehmerwerte?.aktuell ?? "—"}</strong></p><p>Letzter Sync: {form.time2winLastSuccessAt ? formatDatum(form.time2winLastSuccessAt.slice(0, 10)) : "—"}</p><p>Status: {form.time2winSyncStatus ?? "NEVER"}</p>{form.time2winLastError && <p className="text-destructive">{form.time2winLastError}</p>}</div></CardContent></Card></TabsContent>

        <TabsContent value="finanz"><Card><CardHeader><CardTitle className="text-base">Finanz</CardTitle><CardDescription>Standardmäßig ist der Veranstalter als Auszahlungs- und Rechnungsempfänger hinterlegt.</CardDescription></CardHeader><CardContent className="space-y-5"><div><Label>Auszahlungsempfänger</Label><Select value={auszahlungsempfaengerId ?? undefined} onValueChange={(id) => set("auszahlungsempfaengerId", id)}><SelectTrigger aria-label="Auszahlungsempfänger" className="mt-1.5"><SelectValue placeholder="Veranstalter" /></SelectTrigger><SelectContent>{kunden.map((kunde) => <SelectItem key={kunde.id} value={kunde.id}>{kunde.name}</SelectItem>)}</SelectContent></Select>{auszahlungsempfaenger && <div aria-label="Stammdaten Auszahlungsempfänger" className="mt-3"><RecipientMasterData recipient={auszahlungsempfaenger} /></div>}</div><div><Label>Rechnungsempfänger</Label><p className="mt-1 text-xs text-muted-foreground">Mehrere Empfänger möglich.</p><Popover><PopoverTrigger asChild><Button aria-label="Rechnungsempfänger auswählen" variant="outline" className="mt-2 w-full justify-start font-normal">{rechnungsempfaenger.length ? rechnungsempfaenger.map((kunde) => kunde.name).join(", ") : "Rechnungsempfänger auswählen"}</Button></PopoverTrigger><PopoverContent align="start" className="w-[min(28rem,calc(100vw-2rem))] p-2"><Input aria-label="Rechnungsempfänger suchen" placeholder="Rechnungsempfänger suchen …" value={invoiceRecipientSearch} onChange={(e) => setInvoiceRecipientSearch(e.target.value)} /><div className="mt-2 max-h-56 space-y-1 overflow-y-auto">{sichtbareRechnungsempfaenger.length ? sichtbareRechnungsempfaenger.map((kunde) => <label key={kunde.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"><Checkbox checked={rechnungsempfaengerIds.includes(kunde.id)} onCheckedChange={() => toggleRechnungsempfaenger(kunde.id)} />{kunde.name}</label>) : <p className="px-2 py-3 text-sm text-muted-foreground">Keine Treffer</p>}</div></PopoverContent></Popover>{rechnungsempfaenger.length > 0 && <div aria-label="Stammdaten Rechnungsempfänger" className="mt-3 space-y-3">{rechnungsempfaenger.map((kunde) => <RecipientMasterData key={kunde.id} recipient={kunde} />)}</div>}</div></CardContent></Card></TabsContent>

        <TabsContent value="kontakte">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("nav.contacts")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <section>
                <h3 className="font-medium text-foreground">Kontakte des Veranstalters</h3>
                <p className="mt-1 text-sm text-muted-foreground">Stammdatenkontakte des ausgewählten Veranstalters.</p>
                {!event.veranstalterId ? <p className="mt-3 text-sm text-muted-foreground">Kein Veranstalter ausgewählt.</p> : veranstalterKontakte.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Für diesen Veranstalter sind keine Kontakte hinterlegt.</p> : <div className="mt-3 space-y-2">{veranstalterKontakte.map((person) => { const alreadyAdded = form.kontakte.some((item) => item.id === person.id); return <div key={person.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"><div><p className="font-medium text-foreground">{person.vorname} {person.nachname}</p><p className="text-sm text-muted-foreground">{person.email} · {person.telefonBeruflich || person.telefonPrivat || "—"}</p></div><Button variant="outline" size="sm" onClick={() => void addEventContact(person.id, "Kontakt").then(() => toast.success("Als Eventkontakt übernommen."))} disabled={alreadyAdded}>{alreadyAdded ? "Bereits Eventkontakt" : "Als Eventkontakt übernehmen"}</Button></div>; })}</div>}
              </section>
              <section className="border-t border-border pt-5">
                <h3 className="font-medium text-foreground">Eventkontakte & Rollen</h3>
                <p className="mt-1 text-sm text-muted-foreground">Explizit für dieses Event zugeordnete Kontakte.</p>
                <div className="mt-3 flex flex-wrap gap-2"><Popover><PopoverTrigger asChild><Button variant="outline" className="w-56 justify-start font-normal" aria-label="Kontakt auswählen">{contactId ? (() => { const person = personen.find((item) => item.id === contactId); return person ? `${person.vorname} ${person.nachname}` : "Kontakt auswählen"; })() : "Kontakt auswählen"}</Button></PopoverTrigger><PopoverContent align="start" className="w-[min(28rem,calc(100vw-2rem))] p-2"><Input aria-label="Kontakt suchen" placeholder="Kontakt suchen …" value={contactSearch} onChange={(e) => setContactSearch(e.target.value)} /><div className="mt-2 max-h-56 space-y-1 overflow-y-auto">{sichtbareKontakte.length ? sichtbareKontakte.map((person) => <button type="button" key={person.id} className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent" onClick={() => { setContactId(person.id); setContactSearch(""); }}>{person.vorname} {person.nachname}<span className="ml-2 text-muted-foreground">{person.email}</span></button>) : <p className="px-2 py-3 text-sm text-muted-foreground">Keine Treffer</p>}</div></PopoverContent></Popover><Input aria-label="Eventrolle" value={contactRole} onChange={(e) => setContactRole(e.target.value)} className="w-36"/><Button onClick={() => void addContact()} disabled={!contactId}>Hinzufügen</Button></div>
              </section>
              {form.kontakte.length === 0 && (
                <p className="text-sm text-muted-foreground">Noch keine Kontakte hinterlegt.</p>
              )}
              {form.kontakte.length > 0 && <div className="overflow-x-auto rounded-md border border-border"><table className="w-full text-sm"><thead className="bg-muted/50 text-left text-xs text-muted-foreground"><tr><th className="px-3 py-2 font-medium">Kontakt</th><th className="px-3 py-2 font-medium">Rolle</th><th className="px-3 py-2 font-medium">E-Mail</th><th className="px-3 py-2 font-medium">Telefon</th><th className="px-3 py-2"><span className="sr-only">Aktion</span></th></tr></thead><tbody className="divide-y divide-border">{form.kontakte.map((k) => <tr key={k.id}><td className="whitespace-nowrap px-3 py-2 font-medium text-foreground">{k.name}</td><td className="min-w-48 px-3 py-2"><Input aria-label={`Eventrolle für ${k.name}`} defaultValue={k.rolle} className="h-8" onBlur={(e) => void updateContactRole(k, e.target.value)} /></td><td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{k.email || "—"}</td><td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{k.telefon || "—"}</td><td className="px-3 py-2 text-right"><Button variant="ghost" size="sm" onClick={() => void removeEventContact(event.id, k.id, k.rolle).then((result) => { if (result.kind === "saved") setForm(result.event); else toast.error("Kontaktrolle konnte nicht entfernt werden."); })}>Entfernen</Button></td></tr>)}</tbody></table></div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aufgaben">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("nav.tasks")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-2"><Input aria-label="Neue Aufgabe" value={newTask} onChange={(e) => setNewTask(e.target.value)} /><Button onClick={() => void addTask()}>Aufgabe anlegen</Button></div>
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
                      void updateEventTask(event.id, a.id, { completed: !!v }).then((result) => {
                        if (result.kind === "saved") setForm(result.event);
                        else toast.error("Aufgabe konnte nicht gespeichert werden.");
                      })
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
              <div className="flex gap-2"><Input aria-label="Dateiverknüpfung" value={newFile} onChange={(e) => setNewFile(e.target.value)} placeholder="Dateiname oder SharePoint-Link"/><Button onClick={() => void addFile()}>Verknüpfen</Button></div>
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
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2"><Input aria-label="Neue Aktivität" value={newActivity} onChange={(e) => setNewActivity(e.target.value)} placeholder="Betreff der Notiz"/><Button onClick={() => void addActivity()}>Aktivität anlegen</Button></div>
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
                        {m.kanal} · {formatDatum(m.datum)} · {m.autor}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{m.text}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
                set("outlookOrdner", outlookVorschlag);
                void updateEvent(event.id, { outlookOrdner: outlookVorschlag }).then((result) => {
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
