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
import { useT2W } from "@/lib/t2w/store";
import { formatDatum, formatZeitraum, heuteIso } from "@/lib/t2w/format";
import { jahr, quartal } from "@/lib/t2w/eventcode";
import {
  STATUS_LABEL,
  STATUS_ORDER,
  type EventStatus,
  type T2WEvent,
} from "@/lib/t2w/types";

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
  const { updateEvent, settings } = useT2W();
  const [form, setForm] = useState(event);
  const [quartalsDialog, setQuartalsDialog] = useState(false);

  useEffect(() => setForm(event), [event]);

  const vergangen = event.ende < heuteIso();
  const aktuellesQuartal = quartal(form.start);
  const outlookVorschlag = `${settings.outlookStammordner}/${aktuellesQuartal}/${event.eventcode}`;
  const quartalsAbweichung =
    !!form.outlookOrdner && !form.outlookOrdner.includes(`/${aktuellesQuartal}/`);
  const jahresSite = settings.jahresSites.find((s) => s.jahr === jahr(form.start));

  function set<K extends keyof T2WEvent>(key: K, wert: T2WEvent[K]) {
    setForm((p) => ({ ...p, [key]: wert }));
  }

  function speichern() {
    if (!form.start) {
      toast.error("Das Startdatum ist verpflichtend.");
      return;
    }
    const ende = form.ende && form.ende >= form.start ? form.ende : form.start;
    updateEvent(event.id, { ...form, ende });
    toast.success("Änderungen gespeichert.");
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
          <p className="font-mono text-xs text-muted-foreground">{event.eventcode}</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{event.name}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
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
            Quartalswechsel erkannt: Der Outlook-Ordner liegt nicht in {aktuellesQuartal}.
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
          <TabsTrigger value="stammdaten">Stammdaten</TabsTrigger>
          <TabsTrigger value="kontakte">Kontakte</TabsTrigger>
          <TabsTrigger value="aufgaben">Aufgaben</TabsTrigger>
          <TabsTrigger value="dateien">Dateien</TabsTrigger>
          <TabsTrigger value="kommunikation">Kommunikation</TabsTrigger>
        </TabsList>

        <TabsContent value="stammdaten" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Stammdaten</CardTitle>
              <CardDescription>Der Eventcode ist unveränderlich.</CardDescription>
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
                <Label htmlFor="d-code">Eventcode</Label>
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
                <Input
                  id="d-ver"
                  value={form.veranstalter}
                  onChange={(e) => set("veranstalter", e.target.value)}
                  className="mt-1.5"
                />
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kontakte">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kontakte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {form.kontakte.length === 0 && (
                <p className="text-sm text-muted-foreground">Noch keine Kontakte hinterlegt.</p>
              )}
              {form.kontakte.map((k) => (
                <div key={k.id} className="rounded-md border border-border p-3">
                  <p className="font-medium text-foreground">{k.name}</p>
                  <p className="text-sm text-muted-foreground">{k.rolle}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {k.email} · {k.telefon}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aufgaben">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aufgaben</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
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
                      set(
                        "aufgaben",
                        form.aufgaben.map((x) => (x.id === a.id ? { ...x, erledigt: !!v } : x)),
                      )
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
              <CardDescription>Demo-Ansicht des verknüpften SharePoint-Ordners.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
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
                updateEvent(event.id, { outlookOrdner: outlookVorschlag });
                toast.success("Outlook-Verschiebung bestätigt (Demo).");
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
