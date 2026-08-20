import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [stamm, setStamm] = useState(settings.outlookStammordner);
  const [outlookJahresordner, setOutlookJahresordner] = useState(settings.outlookJahresordner);
  const [sites, setSites] = useState(() => nachJahrAbsteigend(settings.jahresSites));

  useEffect(() => {
    setStamm(settings.outlookStammordner);
    setOutlookJahresordner(settings.outlookJahresordner);
    setSites(nachJahrAbsteigend(settings.jahresSites));
  }, [settings]);

  async function speichern() {
    const sortierteSites = nachJahrAbsteigend(sites);
    setSites(sortierteSites);
    try {
      await setSettings({ outlookStammordner: stamm.trim(), outlookJahresordner, jahresSites: sortierteSites });
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Outlook-Jahresordner</CardTitle>
          <CardDescription>
            Struktur: Jahresordner / Quartal / Eventcode – z. B. {outlookJahresordner[0]?.url || stamm || "Auftraege26"}
            /Q2/260612_haendlertag_sued
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="stamm">Fallback-Stammordner</Label>
          <Input id="stamm" value={stamm} onChange={(e) => setStamm(e.target.value)} className="mt-1.5 max-w-sm" />
          <div className="mt-4 overflow-x-auto">
            <div className="min-w-[34rem]">
              <div className="grid grid-cols-[7rem_1fr_5.5rem] items-center gap-2 px-2 pb-2 text-sm font-medium text-muted-foreground">
                <span>Jahr</span><span>Ordnerpfad</span><span>Aktionen</span>
              </div>
              <div className="space-y-2">
            {outlookJahresordner.map((s, i) => (
              <div key={i} className="grid grid-cols-[7rem_1fr_5.5rem] items-center gap-2">
                <Input id={`outlook-jahr-${i}`} aria-label="Jahr" value={s.jahr} onChange={(e) => setOutlookJahresordner(outlookJahresordner.map((x, xi) => xi === i ? { ...x, jahr: e.target.value } : x))} />
                <Input id={`outlook-url-${i}`} aria-label="Ordnerpfad" value={s.url} onChange={(e) => setOutlookJahresordner(outlookJahresordner.map((x, xi) => xi === i ? { ...x, url: e.target.value } : x))} />
                <div className="flex items-center justify-end gap-1">
                <a href="https://outlook.office.com/mail/" target="_blank" rel="noreferrer" aria-label="Outlook-Jahresordner öffnen" title="Outlook öffnen" className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"><ExternalLink className="size-4" /></a>
                <Button variant="ghost" size="icon" aria-label="Outlook-Jahresordner entfernen" onClick={() => setOutlookJahresordner(outlookJahresordner.filter((_, xi) => xi !== i))}><Trash2 className="size-4" /></Button>
                </div>
              </div>
            ))}
              </div>
            </div>
          </div>
          <div className="mt-3">
            <Button type="button" variant="outline" onClick={() => setOutlookJahresordner((current) => [...current, { jahr: "", url: "" }])}><Plus className="size-4" />Outlook-Jahresordner hinzufügen</Button>
          </div>
        </CardContent>
      </Card>

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

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={speichern}>Speichern</Button>
      </div>
    </div>
  );
}
