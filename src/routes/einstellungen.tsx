import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useT2W } from "@/lib/t2w/store";

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
  const [sites, setSites] = useState(settings.jahresSites);

  function speichern() {
    setSettings({ outlookStammordner: stamm.trim(), outlookJahresordner, jahresSites: sites });
    toast.success("Einstellungen gespeichert.");
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
          <Label htmlFor="stamm">Stammordner</Label>
          <Input
            id="stamm"
            value={stamm}
            onChange={(e) => setStamm(e.target.value)}
            className="mt-1.5 max-w-sm"
          />
          <div className="mt-4 space-y-3">
            {outlookJahresordner.map((s, i) => (
              <div key={i} className="flex flex-wrap items-end gap-2">
                <div className="w-24">
                  <Label htmlFor={`outlook-jahr-${i}`}>Jahr</Label>
                  <Input id={`outlook-jahr-${i}`} value={s.jahr} onChange={(e) => setOutlookJahresordner(outlookJahresordner.map((x, xi) => xi === i ? { ...x, jahr: e.target.value } : x))} className="mt-1.5" />
                </div>
                <div className="min-w-[16rem] flex-1">
                  <Label htmlFor={`outlook-url-${i}`}>Ordnerpfad</Label>
                  <Input id={`outlook-url-${i}`} value={s.url} onChange={(e) => setOutlookJahresordner(outlookJahresordner.map((x, xi) => xi === i ? { ...x, url: e.target.value } : x))} className="mt-1.5" />
                </div>
                <Button variant="ghost" size="icon" aria-label="Outlook-Jahresordner entfernen" onClick={() => setOutlookJahresordner(outlookJahresordner.filter((_, xi) => xi !== i))}><Trash2 className="size-4" /></Button>
              </div>
            ))}
            <Button variant="outline" onClick={() => setOutlookJahresordner([...outlookJahresordner, { jahr: "", url: "" }])}><Plus className="size-4" />Outlook-Jahresordner hinzufügen</Button>
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
        <CardContent className="space-y-3">
          {sites.map((s, i) => (
            <div key={i} className="flex flex-wrap items-end gap-2">
              <div className="w-24">
                <Label htmlFor={`jahr-${i}`}>Jahr</Label>
                <Input
                  id={`jahr-${i}`}
                  value={s.jahr}
                  onChange={(e) =>
                    setSites(sites.map((x, xi) => (xi === i ? { ...x, jahr: e.target.value } : x)))
                  }
                  className="mt-1.5"
                />
              </div>
              <div className="min-w-[16rem] flex-1">
                <Label htmlFor={`url-${i}`}>Site-URL</Label>
                <Input
                  id={`url-${i}`}
                  value={s.url}
                  onChange={(e) =>
                    setSites(sites.map((x, xi) => (xi === i ? { ...x, url: e.target.value } : x)))
                  }
                  className="mt-1.5"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Jahres-Site entfernen"
                onClick={() => setSites(sites.filter((_, xi) => xi !== i))}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" onClick={() => setSites([...sites, { jahr: "", url: "" }])}>
            <Plus className="size-4" />
            Jahres-Site hinzufügen
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button onClick={speichern}>Speichern</Button>
      </div>
    </div>
  );
}
