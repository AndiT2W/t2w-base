import { useEffect, useState, useSyncExternalStore } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useT2W } from "@/lib/t2w/store";
import { PageHeader } from "@/components/t2w/PageHeader";
import { apiOutlookStatus } from "@/lib/t2w/api";
import { createSettingsWorkspace } from "@/lib/t2w/settings-workspace";

export const Route = createFileRoute("/einstellungen")({
  validateSearch: (search) => ({
    tab:
      search.tab === "outlook" || search.tab === "auswahllisten"
        ? search.tab
        : ("allgemein" as const),
  }),
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
  const { settings, setSettings, selectionLists, createSelectionValue, updateSelectionValue } =
    useT2W();
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const [workspace] = useState(() =>
    createSettingsWorkspace({ save: setSettings, checkOutlook: apiOutlookStatus }, settings),
  );
  const sports = selectionLists.sports;
  const [newSport, setNewSport] = useState("");
  const eventRoles = selectionLists.eventRoles;
  const [newEventRole, setNewEventRole] = useState("");
  const { draft, connection: outlookStatus } = useSyncExternalStore(
    workspace.subscribe,
    workspace.snapshot,
    workspace.snapshot,
  );
  const { outlookJahresordner, jahresSites: sites, outlookMailbox: mailbox } = draft;
  const setOutlookJahresordner = (
    next:
      | typeof outlookJahresordner
      | ((current: typeof outlookJahresordner) => typeof outlookJahresordner),
  ) =>
    workspace.update({
      outlookJahresordner: typeof next === "function" ? next(outlookJahresordner) : next,
    });
  const setSites = (next: typeof sites | ((current: typeof sites) => typeof sites)) =>
    workspace.update({ jahresSites: typeof next === "function" ? next(sites) : next });
  const setMailbox = (next: string) => workspace.update({ outlookMailbox: next });

  useEffect(() => {
    workspace.acceptLoaded(settings);
  }, [settings, workspace]);
  async function addSport() {
    const name = newSport.trim();
    if (!name) return;
    try {
      await createSelectionValue("sports", name);
      setNewSport("");
      toast.success("Sportart angelegt.");
    } catch {
      toast.error("Sportart konnte nicht angelegt werden.");
    }
  }
  async function saveSport(id: string, patch: { name?: string; active?: boolean }) {
    try {
      await updateSelectionValue("sports", id, patch);
      toast.success("Sportart gespeichert.");
    } catch {
      toast.error("Sportart konnte nicht gespeichert werden.");
    }
  }
  async function addEventRole() {
    const name = newEventRole.trim();
    if (!name) return;
    try {
      await createSelectionValue("eventRoles", name);
      setNewEventRole("");
      toast.success("Eventrolle angelegt.");
    } catch {
      toast.error("Eventrolle konnte nicht angelegt werden.");
    }
  }
  async function saveEventRole(id: string, patch: { name?: string; active?: boolean }) {
    try {
      await updateSelectionValue("eventRoles", id, patch);
      toast.success("Eventrolle gespeichert.");
    } catch {
      toast.error("Eventrolle konnte nicht gespeichert werden.");
    }
  }

  async function speichern() {
    const result = await workspace.save();
    if (result.kind === "saved") {
      toast.success("Einstellungen gespeichert.");
    } else {
      toast.error("Einstellungen konnten nicht gespeichert werden.");
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        krumen={[{ label: "TIME2WIN", to: "/" }]}
        titel="Einstellungen"
        beschreibung="Outlook- und SharePoint-Ordnerkonventionen zentral verwalten."
      />
      <div className="max-w-3xl space-y-5">
        <Tabs
          value={tab}
          onValueChange={(nextTab) =>
            void navigate({
              search: {
                tab: nextTab === "outlook" || nextTab === "auswahllisten" ? nextTab : "allgemein",
              },
            })
          }
          className="space-y-5"
        >
          <TabsList>
            <TabsTrigger value="allgemein">Allgemein</TabsTrigger>
            <TabsTrigger value="auswahllisten">Auswahllisten</TabsTrigger>
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
                      <span>Jahr</span>
                      <span>Site-URL</span>
                      <span>Aktionen</span>
                    </div>
                    <div className="space-y-2">
                      {sites.map((s, i) => (
                        <div
                          key={i}
                          className="grid grid-cols-[7rem_1fr_5.5rem] items-center gap-2"
                        >
                          <Input
                            id={`jahr-${i}`}
                            aria-label="Jahr"
                            value={s.jahr}
                            onChange={(e) =>
                              setSites(
                                sites.map((x, xi) =>
                                  xi === i ? { ...x, jahr: e.target.value } : x,
                                ),
                              )
                            }
                          />
                          <Input
                            id={`url-${i}`}
                            aria-label="Site-URL"
                            value={s.url}
                            onChange={(e) =>
                              setSites(
                                sites.map((x, xi) =>
                                  xi === i ? { ...x, url: e.target.value } : x,
                                ),
                              )
                            }
                          />
                          <div className="flex items-center justify-end gap-1">
                            {s.url.trim() && (
                              <a
                                href={s.url.trim()}
                                target="_blank"
                                rel="noreferrer"
                                aria-label="SharePoint-Jahres-Site öffnen"
                                title="SharePoint öffnen"
                                className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                              >
                                <ExternalLink className="size-4" />
                              </a>
                            )}
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSites((current) => [...current, { jahr: "", url: "" }])}
                  >
                    <Plus className="size-4" />
                    Jahres-Site hinzufügen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="auswahllisten" className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sportarten</CardTitle>
                <CardDescription>
                  Werte für die Sportart-Auswahl beim Anlegen und Bearbeiten eines Events.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {sports.map((sport) => (
                  <div key={sport.id} className="flex items-center gap-2">
                    <Input
                      aria-label={`Sportart ${sport.name}`}
                      defaultValue={sport.name}
                      onBlur={(event) => {
                        const name = event.target.value.trim();
                        if (name && name !== sport.name) void saveSport(sport.id, { name });
                      }}
                    />
                    <Button
                      type="button"
                      variant={sport.active ? "outline" : "secondary"}
                      onClick={() => void saveSport(sport.id, { active: !sport.active })}
                    >
                      {sport.active ? "Deaktivieren" : "Aktivieren"}
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  <Input
                    aria-label="Neue Sportart"
                    value={newSport}
                    onChange={(event) => setNewSport(event.target.value)}
                    placeholder="Sportart hinzufügen"
                  />
                  <Button type="button" onClick={() => void addSport()}>
                    <Plus className="size-4" />
                    Hinzufügen
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Eventrollen</CardTitle>
                <CardDescription>
                  Vorgegebene Rollen für Eventkontakte, z. B. Anmeldung oder Finanz.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {eventRoles.map((role) => (
                  <div key={role.id} className="flex items-center gap-2">
                    <Input
                      aria-label={`Eventrolle ${role.name}`}
                      defaultValue={role.name}
                      onBlur={(event) => {
                        const name = event.target.value.trim();
                        if (name && name !== role.name) void saveEventRole(role.id, { name });
                      }}
                    />
                    <Button
                      type="button"
                      variant={role.active ? "outline" : "secondary"}
                      onClick={() => void saveEventRole(role.id, { active: !role.active })}
                    >
                      {role.active ? "Deaktivieren" : "Aktivieren"}
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  <Input
                    aria-label="Neue Eventrolle"
                    value={newEventRole}
                    onChange={(event) => setNewEventRole(event.target.value)}
                    placeholder="Eventrolle hinzufügen"
                  />
                  <Button type="button" onClick={() => void addEventRole()}>
                    <Plus className="size-4" />
                    Hinzufügen
                  </Button>
                </div>
              </CardContent>
            </Card>
            <p className="text-sm text-muted-foreground">
              Weitere Auswahllisten werden hier ergänzt, sobald sie in einem Arbeitsablauf verwendet
              werden.
            </p>
          </TabsContent>

          <TabsContent value="outlook" className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Outlook-Jahresordner</CardTitle>
                <CardDescription>
                  Struktur: Jahresordner / Quartal / Eventcode – z. B.{" "}
                  {outlookJahresordner[0]?.url || "06_auftraege_26"}/Q2/260612_haendlertag_sued
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="min-w-[34rem]">
                    <div className="grid grid-cols-[7rem_1fr_5.5rem] items-center gap-2 px-2 pb-2 text-sm font-medium text-muted-foreground">
                      <span>Jahr</span>
                      <span>Ordnername</span>
                      <span>Aktionen</span>
                    </div>
                    <div className="space-y-2">
                      {outlookJahresordner.map((s, i) => (
                        <div
                          key={i}
                          className="grid grid-cols-[7rem_1fr_5.5rem] items-center gap-2"
                        >
                          <Input
                            id={`outlook-jahr-${i}`}
                            aria-label="Jahr"
                            value={s.jahr}
                            onChange={(e) =>
                              setOutlookJahresordner(
                                outlookJahresordner.map((x, xi) =>
                                  xi === i ? { ...x, jahr: e.target.value } : x,
                                ),
                              )
                            }
                          />
                          <Input
                            id={`outlook-url-${i}`}
                            aria-label="Jahresordnername"
                            placeholder="z. B. 06_auftraege_26"
                            value={s.url}
                            onChange={(e) =>
                              setOutlookJahresordner(
                                outlookJahresordner.map((x, xi) =>
                                  xi === i ? { ...x, url: e.target.value } : x,
                                ),
                              )
                            }
                          />
                          <div className="flex items-center justify-end gap-1">
                            <a
                              href="https://outlook.office.com/mail/"
                              target="_blank"
                              rel="noreferrer"
                              aria-label="Outlook-Jahresordner öffnen"
                              title="Outlook öffnen"
                              className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                            >
                              <ExternalLink className="size-4" />
                            </a>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Outlook-Jahresordner entfernen"
                              onClick={() =>
                                setOutlookJahresordner(
                                  outlookJahresordner.filter((_, xi) => xi !== i),
                                )
                              }
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setOutlookJahresordner((current) => [...current, { jahr: "", url: "" }])
                    }
                  >
                    <Plus className="size-4" />
                    Outlook-Jahresordner hinzufügen
                  </Button>
                </div>
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
                    <p className="text-sm text-muted-foreground">
                      Die Graph-Verbindung wird beim ersten Ordner-Sync geprüft.
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-sm ${outlookStatus === "success" ? "bg-emerald-100 text-emerald-700" : outlookStatus === "error" ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground"}`}
                  >
                    {outlookStatus === "success"
                      ? "Verbunden"
                      : outlookStatus === "error"
                        ? "Fehler"
                        : outlookStatus === "checking"
                          ? "Prüfe…"
                          : "Noch nicht geprüft"}
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="outlook-mailbox">Outlook-Mailbox</Label>
                    <Input
                      id="outlook-mailbox"
                      value={mailbox}
                      onChange={(e) => setMailbox(e.target.value)}
                      placeholder="kommunikation@example.com"
                      className="mt-1.5"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      UPN oder Adresse der verbundenen Mailbox.
                    </p>
                  </div>
                  <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Outlook-Elternordner:</span>{" "}
                    Posteingang <span className="ml-1 text-xs">(fest, nicht editierbar)</span>
                  </div>
                </div>
                <div className="rounded-lg bg-muted/50 p-4 text-sm">
                  <p className="font-medium">Automatische Ordnerstruktur</p>
                  <p className="mt-1 text-muted-foreground">Jahresordner / Quartal / Eventcode</p>
                  <p className="mt-2 font-mono text-xs text-muted-foreground">
                    2026 / Q2 / 260612_haendlertag_sued
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={outlookStatus === "checking" || !mailbox.trim()}
                    onClick={async () => {
                      await workspace.checkOutlook();
                    }}
                  >
                    Verbindung prüfen
                  </Button>
                  <a href="https://outlook.office.com/mail/" target="_blank" rel="noreferrer">
                    <Button type="button" variant="outline">
                      <ExternalLink className="size-4" />
                      Outlook öffnen
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={speichern}>
            Speichern
          </Button>
        </div>
      </div>
    </div>
  );
}
