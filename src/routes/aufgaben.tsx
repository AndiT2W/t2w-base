import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/t2w/PageHeader";
import { pmRequest, statusLabel, type PmGlobal, type PmState } from "@/lib/t2w/project-management";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export const Route = createFileRoute("/aufgaben")({ component: Aufgaben });
const field = "min-h-11 rounded-md border border-input bg-background px-3 py-2 text-sm";
const supported = [
  "eventFrom",
  "eventTo",
  "dueFrom",
  "dueTo",
  "view",
  "q",
  "all",
  "archive",
  "event",
  "series",
  "group",
  "owner",
  "status",
  "priority",
  "due",
  "blocked",
  "cursor",
  "eventCursor",
];
function Aufgaben() {
  const [params, setParams] = useState<Record<string, string>>({});
  const [data, setData] = useState<PmGlobal>();
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [group, setGroup] = useState<PmState["groups"][number] | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupActive, setGroupActive] = useState(true);
  const [order, setOrder] = useState(0);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const sync = () =>
      setParams(
        Object.fromEntries(
          [...new URLSearchParams(window.location.search)].filter(([k]) => supported.includes(k)),
        ),
      );
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const result = await pmRequest<PmGlobal>(`?${new URLSearchParams(params)}`);
        if (active) {
          setData(result);
          setError("");
        }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Bewertung nicht verfügbar");
      }
    };
    void refresh();
    const timer = setInterval(() => void refresh(), 30000);
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [params, revision]);
  function change(key: string, value: string) {
    const next = { ...params, [key]: value };
    if (!key.includes("Cursor") && key !== "cursor") {
      delete next["cursor"];
      delete next["eventCursor"];
    }
    for (const key of Object.keys(next)) if (!next[key]) delete next[key];
    window.history.pushState(null, "", `${window.location.pathname}?${new URLSearchParams(next)}`);
    setParams(next);
  }
  const choose = (key: string, label: string, options: { value: string; label: string }[]) => (
    <div>
      <Label htmlFor={`pm-filter-${key}`}>{label}</Label>
      <select
        id={`pm-filter-${key}`}
        className={`${field} block w-full`}
        multiple
        value={params[key]?.split(",") ?? []}
        onChange={(e) => change(key, [...e.target.selectedOptions].map((o) => o.value).join(","))}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
  const taskLink = (event: PmState["event"], id?: string, groupId?: string | null) =>
    `/events/${encodeURIComponent(event.eventCode)}?tab=aufgaben${id ? `&pmTask=${id}&pmGroup=${groupId ?? "none"}` : ""}`;
  return (
    <div className="space-y-5">
      <PageHeader titel="Aufgaben" beschreibung="Bezieht sich auf erfasste Aufgaben" />
      <div className="flex flex-wrap gap-2">
        <Button
          variant={params["view"] === "tasks" ? "outline" : "default"}
          onClick={() => change("view", "events")}
        >
          Eventübersicht
        </Button>
        <Button
          variant={params["view"] === "tasks" ? "default" : "outline"}
          onClick={() => change("view", "tasks")}
        >
          Aufgabenansicht
        </Button>
        <Button
          variant="outline"
          onClick={() => change("all", params["all"] === "true" ? "" : "true")}
        >
          {params["all"] === "true" ? "Nur Handlungsbedarf" : "Alle Events"}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            window.history.pushState(null, "", "/aufgaben");
            setParams({});
          }}
        >
          Filter zurücksetzen
        </Button>
      </div>
      <Label htmlFor="pm-search">Suche nach Aufgabe oder Event</Label>
      <Input
        id="pm-search"
        value={params["q"] ?? ""}
        onChange={(e) => change("q", e.target.value)}
      />
      <details className="rounded-md border p-3">
        <summary className="min-h-11 cursor-pointer">
          Filter · Mehrfachauswahl innerhalb eines Feldes möglich
        </summary>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {choose(
            "event",
            "Event",
            data?.eventChoices.map((e) => ({ value: e.id, label: e.name })) ?? [],
          )}
          {choose("series", "Serie", [
            { value: "none", label: "Ohne Serie" },
            ...Array.from(
              new Set(
                data?.eventChoices.map((e) => e.seriesId).filter((id): id is string => !!id) ?? [],
              ),
            ).map((id) => ({
              value: id,
              label:
                data?.eventChoices
                  .filter((e) => e.seriesId === id)
                  .map((e) => e.name)
                  .join(" / ") ?? id,
            })),
          ])}
          {(
            [
              ["eventFrom", "Eventzeitraum von"],
              ["eventTo", "Eventzeitraum bis"],
              ["dueFrom", "Aufgabenfrist von (UTC)"],
              ["dueTo", "Aufgabenfrist bis (UTC)"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <Label htmlFor={`pm-${key}`}>{label}</Label>
              <Input
                id={`pm-${key}`}
                type="date"
                value={params[key] ?? ""}
                onChange={(e) => change(key, e.target.value)}
              />
            </div>
          ))}
          {choose(
            "group",
            "Kategorie",
            data?.groups.map((g) => ({
              value: g.id,
              label: `${g.name}${g.active ? "" : " (inaktiv)"}`,
            })) ?? [],
          )}
          {choose("owner", "Owner", [
            { value: "none", label: "Unzugeordnet" },
            { value: "inactive", label: "Inaktiv" },
            ...(data?.owners
              .filter((o) => o.active)
              .map((o) => ({ value: o.id, label: o.displayName })) ?? []),
          ])}
          {choose(
            "status",
            "Arbeitsstatus",
            Object.entries(statusLabel).map(([value, label]) => ({ value, label })),
          )}
          {choose("priority", "Priorität", [
            { value: "NORMAL", label: "Normal" },
            { value: "HIGH", label: "Hoch" },
          ])}
          {choose("due", "Frist", [
            { value: "overdue", label: "Überfällig" },
            { value: "none", label: "Ohne Frist" },
            { value: "planned", label: "Mit Frist, nicht überfällig" },
          ])}
          {choose("blocked", "Voraussetzung", [
            { value: "yes", label: "Offen" },
            { value: "no", label: "Bereit" },
          ])}
          <div>
            <Label htmlFor="pm-archive">Archiv</Label>
            <select
              id="pm-archive"
              className={`${field} block w-full`}
              value={params["archive"] ?? ""}
              onChange={(e) => change("archive", e.target.value)}
            >
              <option value="">Nicht archiviert</option>
              <option value="archived">Archiviert</option>
              <option value="all">Alle</option>
            </select>
          </div>
        </div>
      </details>
      {error && (
        <p role="alert" className="text-destructive">
          Bewertung nicht verfügbar: {error}
        </p>
      )}
      {!data && !error && <p role="status">Aufgaben werden geladen …</p>}
      {data && (
        <>
          <p className="text-sm text-muted-foreground">
            {params["view"] === "tasks"
              ? `${data.totalTasks} Aufgaben`
              : `${data.totalEvents} Events`}{" "}
            · vollständige gefilterte Anzahl
          </p>
          {params["view"] === "tasks" ? (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr>
                    {["Aufgabe", "Event", "Status", "Owner", "Frist", "Handlungsgrund"].map((h) => (
                      <th key={h} className="p-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.tasks.map((t) => (
                    <tr key={t.id} className="border-t">
                      <td className="p-3">
                        <a className="underline" href={taskLink(t.event, t.id, t.groupId)}>
                          {t.title}
                        </a>
                      </td>
                      <td className="p-3">{t.event.name}</td>
                      <td className="p-3">{statusLabel[t.status]}</td>
                      <td className="p-3">
                        {data.owners.find((o) => o.id === t.ownerId)?.displayName ?? "Unzugeordnet"}
                      </td>
                      <td className="p-3">{t.dueDate ?? t.dueAt ?? "Ohne Frist"}</td>
                      <td className="p-3">
                        {error
                          ? "Bewertung nicht verfügbar"
                          : t.reasons.join(" · ") ||
                            (t.blockedBy.length ? "Voraussetzung offen" : "—")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="divide-y rounded-lg border">
              {data.events.map((s) => (
                <article key={s.event.id} className="p-4">
                  <a className="font-medium underline" href={taskLink(s.event)}>
                    {s.event.name}
                  </a>
                  <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    {s.categories.map((c) => (
                      <p key={c.groupId ?? "none"}>
                        {data.groups.find((g) => g.id === c.groupId)?.name ?? "Ohne Kategorie"}:{" "}
                        {error ? "Bewertung nicht verfügbar" : c.summary}
                        {!error && c.reasons[0] ? ` · ${c.reasons[0].message}` : ""}
                      </p>
                    ))}
                  </div>
                </article>
              ))}
              {!data.events.length && <p className="p-4">Keine passenden Events.</p>}
            </div>
          )}
          {(params["view"] === "tasks" ? data.nextCursor : data.nextEventCursor) && (
            <Button
              variant="outline"
              onClick={() =>
                change(
                  params["view"] === "tasks" ? "cursor" : "eventCursor",
                  (params["view"] === "tasks" ? data.nextCursor : data.nextEventCursor)!,
                )
              }
            >
              Nächste Seite
            </Button>
          )}
          <details className="rounded-md border p-4">
            <summary className="min-h-11 cursor-pointer">Kategorien verwalten (Admin)</summary>
            <div className="flex flex-wrap gap-2">
              {data.groups.map((g) => (
                <Button
                  key={g.id}
                  variant="outline"
                  onClick={() => {
                    setGroup(g);
                    setGroupName(g.name);
                    setGroupActive(g.active);
                    setOrder(g.sortOrder);
                  }}
                >
                  {g.name}
                  {g.active ? "" : " (inaktiv)"}
                </Button>
              ))}
              <Button
                variant="outline"
                onClick={() => {
                  setGroup(null);
                  setGroupName("");
                  setGroupActive(true);
                  setOrder(data.groups.length);
                }}
              >
                Neue Kategorie
              </Button>
            </div>
            <form
              className="mt-4 grid gap-3 sm:grid-cols-2"
              onSubmit={async (e) => {
                e.preventDefault();
                setSaving(true);
                try {
                  await pmRequest("/groups", {
                    ...(group ? { id: group.id, version: group.version } : {}),
                    name: groupName,
                    active: groupActive,
                    sortOrder: order,
                  });
                  setGroup(null);
                  setGroupName("");
                  setRevision((v) => v + 1);
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Speichern fehlgeschlagen");
                } finally {
                  setSaving(false);
                }
              }}
            >
              <div>
                <Label htmlFor="pm-group-name">Kategoriename</Label>
                <Input
                  id="pm-group-name"
                  value={groupName}
                  required
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="pm-group-order">Reihenfolge</Label>
                <Input
                  id="pm-group-order"
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                />
              </div>
              <label className="flex min-h-11 items-center gap-2">
                <input
                  type="checkbox"
                  checked={groupActive}
                  onChange={(e) => setGroupActive(e.target.checked)}
                />
                Aktiv
              </label>
              <Button disabled={saving}>Kategorie speichern</Button>
            </form>
          </details>
        </>
      )}
    </div>
  );
}
