import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Download, ExternalLink, GripVertical, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useT2W } from "@/lib/t2w/store";
import { PageHeader } from "@/components/t2w/PageHeader";
import {
  ServiceBadge,
  SelectionBadge,
  SERVICE_COLOR_OPTIONS,
  ICON_OPTIONS,
  servicePresentation,
  selectionPresentation,
} from "@/components/t2w/ServiceBadge";
import { apiAuditLog, apiOutlookStatus } from "@/lib/t2w/api";
import { createAuditLogWorkspace, type AuditLogEntity } from "@/lib/t2w/audit-log-workspace";
import { createSettingsWorkspace } from "@/lib/t2w/settings-workspace";
import { createSelectionListManagementWorkspace } from "@/lib/t2w/selection-list-management-workspace";
import { formatDatumMitZeit } from "@/lib/t2w/format";
import { DataTable, SortHeader, useTableSort } from "@/components/t2w/DataTable";
import type { ApiAuditLog } from "@/lib/t2w/api";
import { SelectionListPflege } from "@/components/t2w/SelectionListPflege";
import { RecordSheet, SheetGruppe } from "@/components/t2w/RecordSheet";
import { SymbolBibliothek } from "@/components/t2w/SymbolBibliothek";
import type { SelectionListKind } from "@/lib/t2w/selection-list-workspace";
import { UserManagement } from "@/components/t2w/UserManagement";

/** Sortierwerte des Auditlogs. */
const AUDIT_SPALTEN = [
  { key: "Zeitpunkt", sortValue: (entry: ApiAuditLog) => entry.createdAt },
  { key: "Entität", sortValue: (entry: ApiAuditLog) => entry.entity },
  { key: "Aktion", sortValue: (entry: ApiAuditLog) => entry.action },
  {
    key: "Benutzer",
    sortValue: (entry: ApiAuditLog) => entry.user?.displayName ?? entry.user?.email ?? "System",
  },
  { key: "Datensatz", sortValue: (entry: ApiAuditLog) => entry.entityId },
] as const;
type AuditSpalte = (typeof AUDIT_SPALTEN)[number]["key"];

export const Route = createFileRoute("/einstellungen")({
  validateSearch: (search) => ({
    tab:
      search["tab"] === "outlook" ||
      search["tab"] === "benutzer" ||
      search["tab"] === "auswahllisten" ||
      search["tab"] === "auditlog"
        ? search["tab"]
        : ("allgemein" as const),
    liste:
      search["liste"] === "sportarten" ||
      search["liste"] === "eventrollen" ||
      search["liste"] === "aufgabenkategorien" ||
      search["liste"] === "nachrichtenarten" ||
      search["liste"] === "themen" ||
      search["liste"] === "hardwareobjekte"
        ? search["liste"]
        : ("services" as const),
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

/**
 * Die Beschreibung folgt dem Reiter.  Vorher stand auf jedem "Outlook- und
 * SharePoint-Ordnerkonventionen zentral verwalten" -- auch über den
 * Auswahllisten, den Benutzern und dem Auditlog.
 */
const REITER_BESCHREIBUNG: Record<string, string> = {
  allgemein: "Outlook- und SharePoint-Ordnerkonventionen zentral verwalten.",
  benutzer: "Zugänge einladen, Rollen vergeben und Konten sperren.",
  auswahllisten: "Die Werte, aus denen Events, Kommunikation und Hardware wählen.",
  outlook: "Verbindung zum Postfach und Zustand der Synchronisierung.",
  auditlog: "Unveränderliche Aufzeichnungen über relevante Änderungen im System.",
};

function Einstellungen() {
  const {
    settings,
    setSettings,
    selectionLists,
    createSelectionValue,
    updateSelectionValue,
    reorderSelectionValues,
    currentUser,
  } = useT2W();
  const { tab, liste } = Route.useSearch();
  const navigate = useNavigate({ from: "/einstellungen" });
  const [workspace] = useState(() =>
    createSettingsWorkspace({ save: setSettings, checkOutlook: apiOutlookStatus }, settings),
  );
  const [auditLog] = useState(() => createAuditLogWorkspace({ load: apiAuditLog }));
  const management = useMemo(
    () =>
      createSelectionListManagementWorkspace({
        create: createSelectionValue,
        update: updateSelectionValue,
        reorder: reorderSelectionValues,
      }),
    [createSelectionValue, updateSelectionValue, reorderSelectionValues],
  );
  const sports = selectionLists.sports;
  const eventRoles = selectionLists.eventRoles;
  const services = selectionLists.services;
  const hardwareObjects = selectionLists.hardwareObjects;
  const communicationChannels = selectionLists.communicationChannels;
  const communicationTopics = selectionLists.communicationTopics;
  const [dragged, setDragged] = useState<{
    kind: SelectionListKind;
    id: string;
  } | null>(null);
  const [presentation, setPresentation] = useState<{
    kind: SelectionListKind;
    id: string;
  } | null>(null);
  const { draft, connection: outlookStatus } = useSyncExternalStore(
    workspace.subscribe,
    workspace.snapshot,
    workspace.snapshot,
  );
  const audit = useSyncExternalStore(auditLog.subscribe, auditLog.snapshot, auditLog.snapshot);
  const auditTabelle = useTableSort<ApiAuditLog, AuditSpalte>(AUDIT_SPALTEN, {
    key: "Zeitpunkt",
    direction: "desc",
  });
  const auditZeilen = auditTabelle.rows(audit.visibleEntries);
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
  const presentationValue = presentation
    ? selectionLists[presentation.kind].find((value) => value.id === presentation.id)
    : undefined;

  useEffect(() => {
    workspace.acceptLoaded(settings);
  }, [settings, workspace]);
  useEffect(() => {
    if (tab !== "auditlog") return;
    void auditLog.load();
  }, [auditLog, tab]);
  useEffect(() => {
    if (audit.error) toast.error("Auditlog konnte nicht geladen werden.");
  }, [audit.error]);
  function exportAuditLog() {
    const file = auditLog.exportCsv();
    const blob = new Blob([file.contents], { type: file.mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.fileName;
    link.click();
    URL.revokeObjectURL(url);
  }
  const EINZAHL: Record<SelectionListKind, string> = {
    sports: "Sportart",
    services: "Service",
    eventRoles: "Eventrolle",
    hardwareObjects: "Hardware-Objekt",
    communicationChannels: "Nachrichtenart",
    communicationTopics: "Thema",
    taskCategories: "Aufgabenkategorie",
  };

  /** Ein Weg fuer alles am Wert: Name, Symbol, Farbe, Sichtbarkeit. */
  async function wertPflegen(patch: {
    name?: string;
    active?: boolean;
    icon?: string | null;
    color?: string | null;
  }) {
    if (!presentation) return;
    await wertSpeichern(presentation.kind, EINZAHL[presentation.kind], presentation.id, patch);
  }
  /**
   * Anlegen und Speichern melden sich beim Bedienenden -- vorher tat das je
   * Liste eine eigene Funktion mit derselben Meldung in anderer Beugung.
   * Das Hauptwort kommt jetzt von der Liste, der Rest ist einer.
   */
  async function wertAnlegen(kind: SelectionListKind, einzahl: string, name: string) {
    try {
      await createSelectionValue(kind, name);
      toast.success(`${einzahl} angelegt.`);
    } catch {
      toast.error(`${einzahl} konnte nicht angelegt werden.`);
    }
  }

  async function wertSpeichern(
    kind: SelectionListKind,
    einzahl: string,
    id: string,
    patch: { name?: string; active?: boolean; icon?: string | null; color?: string | null },
  ) {
    try {
      await updateSelectionValue(kind, id, patch);
      toast.success(`${einzahl} gespeichert.`);
    } catch {
      toast.error(`${einzahl} konnte nicht gespeichert werden.`);
    }
  }

  /**
   * Gezogen wird auf den Zielplatz.  Das Umsortieren selbst liegt in der
   * Domäne — sie kennt die Reihenfolge und schreibt sie zurück; hier bleibt
   * nur die Rückmeldung an den Bedienenden.
   */
  async function reorderNach(kind: SelectionListKind, gezogenId: string, zielId: string) {
    try {
      await management.reorder(kind, gezogenId, zielId);
    } catch {
      toast.error("Reihenfolge konnte nicht gespeichert werden.");
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
    <div className="space-y-4">
      <PageHeader
        krumen={[{ label: "Übersicht", to: "/" }]}
        titel="Einstellungen"
        beschreibung={REITER_BESCHREIBUNG[tab]}
      />
      <div className="space-y-4">
        <Tabs
          value={tab}
          onValueChange={(nextTab) =>
            void navigate({
              search: {
                tab:
                  nextTab === "outlook" ||
                  nextTab === "benutzer" ||
                  nextTab === "auswahllisten" ||
                  nextTab === "auditlog"
                    ? nextTab
                    : "allgemein",
                liste,
              },
            })
          }
          className="space-y-4"
        >
          {/* Die fuenf Bereiche hingen nur im Untermenue der Seitenleiste:
              wer die Seite ueber einen Link betrat, kam von dort nicht mehr
              weiter.  Das Artboard fuehrt sie zusaetzlich als Reiterleiste
              auf der Seite -- im selben Unterstrich-Stil wie das Eventdetail. */}
          <TabsList variante="unterstrich" className="w-full max-w-full flex-wrap justify-start">
            {(
              [
                ["allgemein", "Allgemein"],
                ["benutzer", "Benutzer"],
                ["auswahllisten", "Auswahllisten"],
                ["outlook", "Outlook"],
                ["auditlog", "Auditlog"],
              ] as const
            ).map(([wert, beschriftung]) => (
              <TabsTrigger key={wert} variante="unterstrich" value={wert}>
                {beschriftung}
              </TabsTrigger>
            ))}
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

          <TabsContent value="benutzer" className="space-y-5">
            <UserManagement />
          </TabsContent>

          <TabsContent value="auswahllisten" className="space-y-5">
            <div className="space-y-5">
              <Card>
                <CardContent className="p-2">
                  <div
                    className="flex flex-wrap gap-1"
                    role="tablist"
                    aria-label="Auswahllisten Kategorien"
                  >
                    {(
                      [
                        ["sportarten", "Sportarten"],
                        ["services", "Services"],
                        ["eventrollen", "Eventrollen"],
                        ["hardwareobjekte", "Hardware-Objekte"],
                        ["nachrichtenarten", "Kommunikation / Nachrichtenarten"],
                        ["themen", "Kommunikation / Themen"],
                        ["aufgabenkategorien", "Projektmanagement / Aufgaben"],
                      ] as const
                    ).map(([value, label]) => (
                      <Button
                        key={value}
                        type="button"
                        variant={liste === value ? "secondary" : "ghost"}
                        className="min-h-10 flex-1 justify-center sm:flex-none"
                        role="tab"
                        aria-selected={liste === value}
                        onClick={() =>
                          void navigate({ search: { tab: "auswahllisten", liste: value } })
                        }
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <div className="space-y-5">
                {(
                  [
                    [
                      "sportarten",
                      "sports",
                      "Sportarten",
                      "Sportart",
                      "Neue Sportart",
                      "Sportartvorschau",
                      "Werte für die Sportart-Auswahl beim Anlegen und Bearbeiten eines Events.",
                    ],
                    [
                      "services",
                      "services",
                      "Services",
                      "Service",
                      "Neuer Service",
                      "Servicevorschau",
                      "Leistungen, die ein Event bucht. Symbol und Farbe tragen die Servicespalte der Eventtabelle.",
                    ],
                    [
                      "eventrollen",
                      "eventRoles",
                      "Eventrollen",
                      "Eventrolle",
                      "Neue Eventrolle",
                      "Eventrollenvorschau",
                      "Rollen, in denen Kontakte einem Event zugeordnet werden.",
                    ],
                    [
                      "hardwareobjekte",
                      "hardwareObjects",
                      "Hardware-Objekte",
                      "Hardware-Objekt",
                      "Neues Hardware-Objekt",
                      "Hardware-Objektvorschau",
                      "Objektarten der Hardwareausgabe. Das Symbol steht in der Hardwaretabelle vor der Bezeichnung.",
                    ],
                    [
                      "nachrichtenarten",
                      "communicationChannels",
                      "Kommunikation / Nachrichtenarten",
                      "Nachrichtenart",
                      "Neue Nachrichtenart",
                      "Nachrichtenartvorschau",
                      "Arten der Kommunikationseinträge samt Symbol. Sie tragen die Symbolspalte und die Filterleiste im Kommunikationsreiter.",
                    ],
                    [
                      "themen",
                      "communicationTopics",
                      "Kommunikation / Themen",
                      "Thema",
                      "Neues Thema",
                      "Themenvorschau",
                      "Bezug eines Kommunikationseintrags, wenn keine einzelne Person dahintersteht.",
                    ],
                    [
                      "aufgabenkategorien",
                      "taskCategories",
                      "Projektmanagement / Aufgaben",
                      "Aufgabenkategorie",
                      "Neue Aufgabenkategorie",
                      "Aufgabenkategorievorschau",
                      "Kategorien, nach denen die Aufgaben eines Events gruppiert werden.",
                    ],
                  ] as const
                ).map(
                  ([slug, kind, titel, einzahl, neuLabel, vorschauLabel, beschreibung]) =>
                    liste === slug && (
                      <SelectionListPflege
                        key={slug}
                        kind={kind}
                        titel={titel}
                        einzahl={einzahl}
                        neuLabel={neuLabel}
                        vorschauLabel={vorschauLabel}
                        beschreibung={beschreibung}
                        werte={selectionLists[kind]}
                        anlegen={(name) => wertAnlegen(kind, einzahl, name)}
                        sortieren={(gezogenId, zielId) => reorderNach(kind, gezogenId, zielId)}
                        oeffnen={(id) => setPresentation({ kind, id })}
                      />
                    ),
                )}
                <RecordSheet
                  open={presentationValue !== undefined}
                  onOpenChange={(offen) => !offen && setPresentation(null)}
                  titel={presentationValue?.name ?? ""}
                  beschreibung={`${presentation ? EINZAHL[presentation.kind] : ""} bearbeiten: Name, Symbol, Farbe und Sichtbarkeit.`}
                  marke={
                    presentationValue ? (
                      <span aria-hidden="true" className="flex shrink-0 items-center">
                        <SelectionBadge {...presentationValue} />
                      </span>
                    ) : undefined
                  }
                  nebenaktion={
                    presentationValue && presentation ? (
                      <Button
                        type="button"
                        variant={presentationValue.active ? "outline" : "secondary"}
                        onClick={() => void wertPflegen({ active: !presentationValue.active })}
                      >
                        {presentationValue.active ? "Deaktivieren" : "Aktivieren"}
                      </Button>
                    ) : undefined
                  }
                >
                  {presentationValue && presentation && (
                    <div className="space-y-5">
                      <SheetGruppe titel="Name">
                        <Input
                          aria-label={`${EINZAHL[presentation.kind]} ${presentationValue.name}`}
                          defaultValue={presentationValue.name}
                          key={presentationValue.id}
                          onBlur={(ereignis) => {
                            const name = ereignis.target.value.trim();
                            if (name && name !== presentationValue.name) void wertPflegen({ name });
                          }}
                        />
                      </SheetGruppe>
                      <section aria-labelledby="service-icon-heading">
                        <h3 id="service-icon-heading" className="mb-2 text-sm font-medium">
                          Symbol
                        </h3>
                        <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
                          {ICON_OPTIONS.map((option) => {
                            const Icon = selectionPresentation({
                              name: presentationValue.name,
                              icon: option.value,
                            }).Icon;
                            const selected =
                              selectionPresentation(presentationValue).icon === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                aria-label={option.label}
                                aria-pressed={selected}
                                title={option.label}
                                className={`grid min-h-11 place-items-center rounded-md border p-2 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected ? "border-primary bg-primary/10 text-primary" : "border-border"}`}
                                onClick={() => void wertPflegen({ icon: option.value })}
                              >
                                <Icon className="size-5" aria-hidden="true" />
                              </button>
                            );
                          })}
                        </div>
                      </section>
                      <section aria-labelledby="service-upload-heading">
                        <h3 id="service-upload-heading" className="mb-2 text-sm font-medium">
                          Eigene Symbole
                        </h3>
                        <SymbolBibliothek
                          gewaehlt={presentationValue.icon}
                          waehlen={(wert) => void wertPflegen({ icon: wert })}
                          darfPflegen={currentUser.role === "ADMIN"}
                        />
                      </section>
                      <section aria-labelledby="service-color-heading">
                        <h3 id="service-color-heading" className="mb-2 text-sm font-medium">
                          Farbe
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {SERVICE_COLOR_OPTIONS.map((option) => {
                            const selected =
                              selectionPresentation(presentationValue).color === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                aria-label={option.label}
                                aria-pressed={selected}
                                title={option.label}
                                className={`size-11 rounded-full border-2 p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected ? "border-primary" : "border-transparent"}`}
                                onClick={() => void wertPflegen({ color: option.value })}
                              >
                                <span
                                  className={`block size-full rounded-full border ${selectionPresentation({ name: presentationValue.name, color: option.value }).className}`}
                                  aria-hidden="true"
                                />
                              </button>
                            );
                          })}
                        </div>
                      </section>
                    </div>
                  )}
                </RecordSheet>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="auditlog" className="space-y-5">
            <Card>
              <CardHeader>
                {/* Ohne eigene Beschreibung: denselben Satz trug seit dem
                    reiterabhaengigen Untertitel auch der Seitenkopf. */}
                <CardTitle className="text-base">Auditlog</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-end">
                  <div className="max-w-xs flex-1 space-y-2">
                    <Label htmlFor="audit-search">Auditlog durchsuchen</Label>
                    <div className="relative">
                      <Search
                        className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <Input
                        id="audit-search"
                        aria-label="Auditlog durchsuchen"
                        value={audit.search}
                        onChange={(event) => auditLog.search(event.target.value)}
                        className="pl-9"
                        placeholder="Aktion, Benutzer oder Datensatz …"
                      />
                    </div>
                  </div>
                  <div className="max-w-xs flex-1 space-y-2">
                    <Label htmlFor="audit-entity">Entität filtern</Label>
                    <select
                      id="audit-entity"
                      aria-label="Auditlog nach Entität filtern"
                      value={audit.entity}
                      onChange={(event) =>
                        void auditLog.selectEntity(event.target.value as AuditLogEntity)
                      }
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">Alle Entitäten</option>
                      <option value="Event">Events</option>
                      <option value="Payout">Auszahlungen</option>
                      <option value="Hardware">Hardware</option>
                    </select>
                  </div>
                  <Button type="button" variant="outline" onClick={exportAuditLog}>
                    <Download className="size-4" /> Exportieren ({audit.visibleEntries.length})
                  </Button>
                </div>
                <div className="space-y-2">
                  <DataTable exportName="Auditlog" className="min-w-[42rem] text-sm">
                    <caption className="sr-only">Auditlog-Einträge</caption>
                    <thead className="t2w-table-header text-left">
                      <tr>
                        {AUDIT_SPALTEN.map((spalte) => (
                          <th key={spalte.key} className="px-3 py-2">
                            <SortHeader
                              label={spalte.key}
                              active={auditTabelle.sort.key === spalte.key}
                              direction={auditTabelle.sort.direction}
                              onSort={() => auditTabelle.sortBy(spalte.key)}
                            />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {auditZeilen.map((entry) => (
                        <tr key={entry.id}>
                          <td className="whitespace-nowrap px-3 py-2">
                            {formatDatumMitZeit(entry.createdAt)}
                          </td>
                          <td className="px-3 py-2">{entry.entity}</td>
                          <td className="px-3 py-2 font-medium">{entry.action}</td>
                          <td className="px-3 py-2">
                            {entry.user?.displayName ?? entry.user?.email ?? "System"}
                          </td>
                          <td
                            className="max-w-[16rem] truncate px-3 py-2 font-mono text-xs"
                            title={entry.entityId}
                          >
                            {entry.entityId}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </DataTable>
                  {!audit.loading && audit.visibleEntries.length === 0 && (
                    <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                      Keine Auditlog-Einträge gefunden.
                    </p>
                  )}
                  {audit.loading && (
                    <p
                      className="px-3 py-8 text-center text-sm text-muted-foreground"
                      role="status"
                    >
                      Auditlog wird geladen …
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
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
