import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useT2W } from "@/lib/t2w/store";

function nachJahrAbsteigend<T extends { jahr: string }>(eintraege: T[]) {
  return [...eintraege].sort((a, b) => {
    const jahrA = Number.parseInt(a.jahr, 10);
    const jahrB = Number.parseInt(b.jahr, 10);
    if (Number.isNaN(jahrA) && Number.isNaN(jahrB)) return 0;
    if (Number.isNaN(jahrA)) return 1;
    if (Number.isNaN(jahrB)) return -1;
    return jahrB - jahrA;
  });
}

export const Route = createFileRoute("/einstellungen")({
  head: () => ({
    meta: [
      { title: "Einstellungen – TIME2WIN Eventverwaltung" },
      {
        name: "description",
        content:
          "Outlook-Stammordner und SharePoint-Jahres-Sites für die Eventverwaltung konfigurieren.",
      },
      { property: "og:title", content: "Einstellungen – TIME2WIN Eventverwaltung" },
      {
        property: "og:description",
        content: "Ordnerstruktur für Outlook und SharePoint zentral pflegen.",
      },
    ],
  }),
  component: Einstellungen,
});

function Einstellungen() {
  const { settings, setSettings } = useT2W();
  const [outlookJahresordner, setOutlookJahresordner] = useState(settings.outlookJahresordner);
  const [sites, setSites] = useState(() => nachJahrAbsteigend(settings.jahresSites));
  const [mailbox, setMailbox] = useState(settings.outlookMailbox ?? "");
  const [outlookStatus, setOutlookStatus] = useState<"idle" | "checking" | "success" | "error">("idle");

  useEffect(() => {
    setOutlookJahresordner(settings.outlookJahresordner);
    setSites(nachJahrAbsteigend(settings.jahresSites));
    setMailbox(settings.outlookMailbox ?? "");
  }, [settings]);

  async function speichern() {
    const sortierteSites = nachJahrAbsteigend(sites);
    setSites(sortierteSites);
    try {
      await setSettings({ outlookJahresordner, jahresSites: sortierteSites, outlookMailbox: mailbox.trim() || null });
      toast.success("Einstellungen gespeichert.");
    } catch {
      toast.error("Einstellungen konnten nicht gespeichert werden.");
    }
  }

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Einstellungen</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ordnerkonventionen für Outlook und SharePoint. Es bestehen keine echten Integrationen –
          Verknüpfungen werden manuell gepflegt.
        </p>
      </div>

      <Tabs defaultValue="allgemein" className="space-y-5">
        <TabsList>
          <TabsTrigger value="allgemein">Allgemein</TabsTrigger>
          <TabsTrigger value="outlook">Outlook</TabsTrigger>
        </TabsList>

        <TabsContent value="allgemein" className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">SharePoint Jahres-Sites</CardTitle>
          <CardDescription>
            Events liegen direkt im Jahresbereich – ohne Quartalsordner.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[34rem]">
              <div className="grid grid-cols-[7rem_1fr_5.5rem] items-center gap-2 px-2 pb-2 text-sm font-medium text-muted-foreground">
                <span>Jahr</span><span>Site-URL</span><span>Aktionen</span>
              </div>
              <div className="space-y-2">
          {sites.map((s, i) => (
            <div key={i} className="grid grid-cols-[7rem_1fr_5.5rem] items-center gap-2">
                <Input
                  id={`jahr-${i}`}
                  aria-label="Jahr"
                  value={s.jahr}
                  onChange={(e) =>
                    setSites(sites.map((x, xi) => (xi === i ? { ...x, jahr: e.target.value } : x)))
                  }
                />
                <Input
                  id={`url-${i}`}
                  aria-label="Site-URL"
                  value={s.url}
                  onChange={(e) =>
                    setSites(sites.map((x, xi) => (xi === i ? { ...x, url: e.target.value } : x)))
                  }
                />
              <div className="flex items-center justify-end gap-1">
              {s.url.trim() && <a href={s.url.trim()} target="_blank" rel="noreferrer" aria-label="SharePoint-Jahres-Site öffnen" title="SharePoint öffnen" className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"><ExternalLink className="size-4" /></a>}
              <Button
                variant="ghost"
                size="icon"
                aria-label="Jahres-Site entfernen"
                onClick={() => setSites(sites.filter((_, xi) => xi !== i))}
              >
                <Trash2 className="size-4" />
              </Button>
              </div>
            </div>
          ))}
              </div>
            </div>
          </div>
          <div className="mt-3">
          <Button type="button" variant="outline" onClick={() => setSites((current) => [...current, { jahr: "", url: "" }])}>
            <Plus className="size-4" />
            Jahres-Site hinzufügen
          </Button>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="outlook" className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Outlook-Jahresordner</CardTitle>
              <CardDescription>
                Struktur: Jahresordner / Quartal / Eventcode – z. B. {outlookJahresordner[0]?.url || "06_auftraege_26"}/Q2/260612_haendlertag_sued
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="min-w-[34rem]">
                  <div className="grid grid-cols-[7rem_1fr_5.5rem] items-center gap-2 px-2 pb-2 text-sm font-medium text-muted-foreground"><span>Jahr</span><span>Ordnername</span><span>Aktionen</span></div>
                  <div className="space-y-2">
                    {outlookJahresordner.map((s, i) => (
                      <div key={i} className="grid grid-cols-[7rem_1fr_5.5rem] items-center gap-2">
                        <Input id={`outlook-jahr-${i}`} aria-label="Jahr" value={s.jahr} onChange={(e) => setOutlookJahresordner(outlookJahresordner.map((x, xi) => xi === i ? { ...x, jahr: e.target.value } : x))} />
                        <Input id={`outlook-url-${i}`} aria-label="Jahresordnername" placeholder="z. B. 06_auftraege_26" value={s.url} onChange={(e) => setOutlookJahresordner(outlookJahresordner.map((x, xi) => xi === i ? { ...x, url: e.target.value } : x))} />
                        <div className="flex items-center justify-end gap-1"><a href="https://outlook.office.com/mail/" target="_blank" rel="noreferrer" aria-label="Outlook-Jahresordner öffnen" title="Outlook öffnen" className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"><ExternalLink className="size-4" /></a><Button variant="ghost" size="icon" aria-label="Outlook-Jahresordner entfernen" onClick={() => setOutlookJahresordner(outlookJahresordner.filter((_, xi) => xi !== i))}><Trash2 className="size-4" /></Button></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-3"><Button type="button" variant="outline" onClick={() => setOutlookJahresordner((current) => [...current, { jahr: "", url: "" }])}><Plus className="size-4" />Outlook-Jahresordner hinzufügen</Button></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Outlook-Integration</CardTitle>
              <CardDescription>
                Status und Konfiguration der Outlook-Ordneranbindung über Microsoft Graph.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">Verbindungsstatus</p>
                  <p className="text-sm text-muted-foreground">Die Graph-Verbindung wird beim ersten Ordner-Sync geprüft.</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-sm ${outlookStatus === "success" ? "bg-emerald-100 text-emerald-700" : outlookStatus === "error" ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground"}`}>{outlookStatus === "success" ? "Verbunden" : outlookStatus === "error" ? "Fehler" : outlookStatus === "checking" ? "Prüfe…" : "Noch nicht geprüft"}</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="outlook-mailbox">Outlook-Mailbox</Label>
                  <Input id="outlook-mailbox" value={mailbox} onChange={(e) => setMailbox(e.target.value)} placeholder="kommunikation@example.com" className="mt-1.5" />
                  <p className="mt-1 text-xs text-muted-foreground">UPN oder Adresse der verbundenen Mailbox.</p>
                </div>
                <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground"><span className="font-medium text-foreground">Outlook-Elternordner:</span> Posteingang <span className="ml-1 text-xs">(fest, nicht editierbar)</span></div>
              </div>
              <div className="rounded-lg bg-muted/50 p-4 text-sm">
                <p className="font-medium">Automatische Ordnerstruktur</p>
                <p className="mt-1 text-muted-foreground">Jahresordner / Quartal / Eventcode</p>
                <p className="mt-2 font-mono text-xs text-muted-foreground">2026 / Q2 / 260612_haendlertag_sued</p>
              </div>
              <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" disabled={outlookStatus === "checking" || !mailbox.trim()} onClick={async () => { setOutlookStatus("checking"); try { const response = await fetch("/api/v1/settings/outlook/status", { credentials: "include" }); const result = await response.json() as { connected?: boolean }; if (!response.ok || result.connected !== true) throw new Error(); setOutlookStatus("success"); } catch { setOutlookStatus("error"); } }}>Verbindung prüfen</Button>
                <a href="https://outlook.office.com/mail/" target="_blank" rel="noreferrer">
                  <Button type="button" variant="outline"><ExternalLink className="size-4" />Outlook öffnen</Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={speichern}>Speichern</Button>
      </div>
    </div>
  );
}
