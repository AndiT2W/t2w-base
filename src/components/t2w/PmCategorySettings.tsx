import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  SelectionBadge,
  SERVICE_COLOR_OPTIONS,
  ICON_OPTIONS,
  selectionPresentation,
} from "@/components/t2w/ServiceBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  pmGroupSave,
  pmGroupsRead,
  pmGroupsReorder,
  type PmGroup,
} from "@/lib/t2w/project-management";

type PresentationDraft = {
  group: PmGroup;
  icon: string;
  color: string;
};

export function PmCategorySettings() {
  const [groups, setGroups] = useState<PmGroup[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragged, setDragged] = useState<string | null>(null);
  const [presentation, setPresentation] = useState<PresentationDraft | null>(null);
  const locked = useRef(false);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const next = await pmGroupsRead();
      setGroups(next.groups);
      setError("");
    } catch (value) {
      setError(value instanceof Error ? value.message : "Kategorien konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function change(work: () => Promise<void>, message: string) {
    if (locked.current) return false;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      await work();
      toast.success(message);
      return true;
    } catch (value) {
      setError(
        value instanceof Error ? value.message : "Kategorie konnte nicht gespeichert werden.",
      );
      return false;
    } finally {
      locked.current = false;
      setBusy(false);
      setDragged(null);
    }
  }

  function save(
    group: PmGroup,
    patch: Partial<Pick<PmGroup, "name" | "icon" | "color" | "active">>,
  ) {
    return change(async () => {
      const saved = await pmGroupSave({ ...group, ...patch });
      setGroups((current) => current.map((item) => (item.id === saved.id ? saved : item)));
      if (patch.name !== undefined) {
        setNames((current) => {
          const next = { ...current };
          delete next[group.id];
          return next;
        });
      }
    }, "Kategorie gespeichert.");
  }

  function reorder(id: string, targetId: string) {
    const from = groups.findIndex((group) => group.id === id);
    const to = groups.findIndex((group) => group.id === targetId);
    if (from < 0 || to < 0 || from === to) return;
    return change(async () => {
      const next = [...groups];
      next.splice(to, 0, next.splice(from, 1)[0]!);
      setGroups((await pmGroupsReorder(next)).groups);
    }, "Reihenfolge gespeichert.");
  }

  const disabled = loading || busy;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Aufgabenkategorien</CardTitle>
        <CardDescription>
          Gemeinsame Kategorien für das Projektmanagement in Events und globale Aufgaben. Inaktive
          Kategorien bleiben bei bestehenden Aufgaben erhalten. Symbol und Farbe erscheinen in den
          Aufgabenansichten zusammen mit dem Kategorienamen.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="space-y-2">
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
            <Button type="button" variant="outline" disabled={disabled} onClick={() => void load()}>
              Kategorien neu laden
            </Button>
          </div>
        )}
        {loading && (
          <p role="status" className="text-sm text-muted-foreground">
            Kategorien werden geladen …
          </p>
        )}
        <form
          className="space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            const name = newName.trim();
            if (!name) return;
            void change(async () => {
              const saved = await pmGroupSave({
                name,
                active: true,
                sortOrder: Math.max(-1, ...groups.map((group) => group.sortOrder)) + 1,
              });
              setGroups((current) => [...current, saved]);
              setNewName("");
            }, "Kategorie angelegt.");
          }}
        >
          <Label htmlFor="new-task-category">Neue Kategorie</Label>
          <div className="flex flex-wrap gap-2">
            <Input
              id="new-task-category"
              className="min-w-0 flex-1"
              value={newName}
              disabled={disabled}
              onChange={(event) => setNewName(event.target.value)}
            />
            <Button type="submit" disabled={disabled || !newName.trim()}>
              <Plus className="size-4" />
              Hinzufügen
            </Button>
          </div>
        </form>
        {!loading && !error && groups.length === 0 && (
          <p className="text-sm text-muted-foreground">Noch keine Kategorien angelegt.</p>
        )}
        <ul aria-label="Aufgabenkategorien" className="space-y-2">
          {groups.map((group, index) => {
            const name = names[group.id] ?? group.name;
            const dirty = name.trim() !== group.name;
            return (
              <li
                key={group.id}
                aria-label={group.name}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  if (dragged && !disabled) void reorder(dragged, group.id);
                }}
                className="flex flex-wrap items-end gap-3 rounded-md border p-3"
              >
                <form
                  className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-2 lg:w-auto lg:flex-1"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (dirty && name.trim()) void save(group, { name: name.trim() });
                  }}
                >
                  <div className="min-w-0 space-y-1">
                    <Label htmlFor={`task-category-${group.id}`}>Kategorie</Label>
                    <Input
                      id={`task-category-${group.id}`}
                      aria-label={`Kategorie ${group.name}`}
                      value={name}
                      disabled={disabled}
                      onChange={(event) =>
                        setNames((current) => ({ ...current, [group.id]: event.target.value }))
                      }
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={disabled || !dirty || !name.trim()}
                    aria-label={`Kategorie ${group.name} speichern`}
                  >
                    Speichern
                  </Button>
                </form>
                <Button
                  type="button"
                  variant={group.active ? "outline" : "secondary"}
                  disabled={disabled}
                  aria-label={`Kategorie ${group.name} ${group.active ? "deaktivieren" : "aktivieren"}`}
                  onClick={() => void save(group, { active: !group.active })}
                >
                  {group.active ? "Deaktivieren" : "Aktivieren"}
                </Button>
                <div className="flex w-full min-w-0 items-center justify-between gap-2 sm:flex-1 lg:w-auto lg:flex-none">
                  <SelectionBadge
                    name={group.name}
                    icon={group.icon}
                    color={group.color}
                    className="min-w-0"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    aria-label={`Darstellung für ${group.name} bearbeiten`}
                    onClick={() => {
                      const current = selectionPresentation(group);
                      setPresentation({
                        group,
                        icon: current.icon,
                        color: current.color,
                      });
                    }}
                  >
                    Darstellung
                  </Button>
                </div>
                <div className="flex items-center gap-1">
                  <span
                    draggable={!disabled}
                    onDragStart={() => setDragged(group.id)}
                    onDragEnd={() => setDragged(null)}
                    title="Kategorie ziehen, um sie zu verschieben"
                    className="cursor-grab p-2 text-muted-foreground"
                  >
                    <GripVertical className="size-4" aria-hidden="true" />
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-11"
                    disabled={disabled || index === 0}
                    aria-label={`${group.name} nach oben`}
                    onClick={() => void reorder(group.id, groups[index - 1]!.id)}
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-11"
                    disabled={disabled || index === groups.length - 1}
                    aria-label={`${group.name} nach unten`}
                    onClick={() => void reorder(group.id, groups[index + 1]!.id)}
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
        <Dialog
          open={presentation !== null}
          onOpenChange={(open) => !open && !busy && setPresentation(null)}
        >
          <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
            {presentation && (
              <>
                <DialogHeader>
                  <DialogTitle>Darstellung: {presentation.group.name}</DialogTitle>
                  <DialogDescription>
                    Symbol und Farbe gelten in Event-Aufgaben, Gesamtübersicht und Zeitansichten.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-5">
                  <section aria-labelledby="task-category-icon-heading">
                    <h3 id="task-category-icon-heading" className="mb-2 text-sm font-medium">
                      Symbol
                    </h3>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                      {ICON_OPTIONS.map((option) => {
                        const Icon = selectionPresentation({
                          name: presentation.group.name,
                          icon: option.value,
                        }).Icon;
                        const selected = presentation.icon === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            aria-pressed={selected}
                            className={`flex min-h-11 items-center gap-2 rounded-md border px-3 py-2 text-left text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected ? "border-primary bg-primary/10 text-primary" : "border-border"}`}
                            onClick={() =>
                              setPresentation((current) =>
                                current ? { ...current, icon: option.value } : current,
                              )
                            }
                          >
                            <Icon className="size-5 shrink-0" aria-hidden="true" />
                            <span>{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                  <section aria-labelledby="task-category-color-heading">
                    <h3 id="task-category-color-heading" className="mb-2 text-sm font-medium">
                      Farbe
                    </h3>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {SERVICE_COLOR_OPTIONS.map((option) => {
                        const selected = presentation.color === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            aria-pressed={selected}
                            className={`flex min-h-11 items-center gap-2 rounded-md border px-3 py-2 text-left text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected ? "border-primary bg-primary/10" : "border-border"}`}
                            onClick={() =>
                              setPresentation((current) =>
                                current ? { ...current, color: option.value } : current,
                              )
                            }
                          >
                            <span
                              className={`size-5 shrink-0 rounded-full border ${selectionPresentation({ name: presentation.group.name, color: option.value }).className}`}
                              aria-hidden="true"
                            />
                            <span>{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                  <div>
                    <p className="mb-2 text-sm font-medium">Vorschau</p>
                    <SelectionBadge
                      name={presentation.group.name}
                      icon={presentation.icon}
                      color={presentation.color}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => setPresentation(null)}
                  >
                    Abbrechen
                  </Button>
                  <Button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      void save(presentation.group, {
                        icon: presentation.icon,
                        color: presentation.color,
                      }).then((saved) => saved && setPresentation(null));
                    }}
                  >
                    Darstellung speichern
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
