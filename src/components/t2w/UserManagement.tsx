import { useEffect, useState } from "react";
import { Copy, MailPlus, RefreshCw, ShieldCheck, UserRoundCog } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiCustomers } from "@/lib/t2w/api";
import {
  apiInviteUser,
  apiResendInvitation,
  apiRevokeInvitation,
  apiUnlockUser,
  apiUpdateUser,
  apiUsers,
  type ManagedUser,
  type UserRole,
  type UserStatus,
} from "@/lib/t2w/users";

type Organizer = { id: string; name: string; active?: boolean };
const roleLabel: Record<UserRole, string> = {
  ADMIN: "Admin",
  USER: "Benutzer",
  ORGANIZER: "Veranstalter",
};
const statusLabel: Record<UserStatus, string> = {
  INVITED: "Eingeladen",
  ACTIVE: "Aktiv",
  DISABLED: "Deaktiviert",
};

export function UserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [filter, setFilter] = useState<"ALL" | UserStatus>("ALL");
  const [busy, setBusy] = useState(false);
  const [invite, setInvite] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "USER" as UserRole,
    financeAccess: false,
    organizerId: "",
  });
  const [drafts, setDrafts] = useState<Record<string, ManagedUser & { password?: string }>>({});

  const load = async () => {
    const [nextUsers, nextOrganizers] = await Promise.all([apiUsers(), apiCustomers()]);
    setUsers(nextUsers);
    setOrganizers((nextOrganizers as Organizer[]).filter((item) => item.active !== false));
    setDrafts(Object.fromEntries(nextUsers.map((user) => [user.id, { ...user }])));
  };
  useEffect(() => {
    void load().catch((error) => toast.error(error.message));
  }, []);

  const copyLink = async (url?: string) => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    toast.success("Aktivierungslink kopiert.");
  };
  const shown = users.filter((user) => filter === "ALL" || user.status === filter);
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MailPlus className="size-4" /> Benutzer einladen
          </CardTitle>
          <CardDescription>
            Rolle, Finanzzugriff und bei Veranstaltern die feste Stammdaten-Verknüpfung festlegen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              setBusy(true);
              void apiInviteUser({
                ...invite,
                organizerId: invite.role === "ORGANIZER" ? invite.organizerId : null,
              })
                .then(async (saved) => {
                  await load();
                  setInvite({
                    email: "",
                    firstName: "",
                    lastName: "",
                    role: "USER",
                    financeAccess: false,
                    organizerId: "",
                  });
                  toast.success("Einladung erstellt.");
                  await copyLink(saved.activationUrl);
                })
                .catch((error) => toast.error(error.message))
                .finally(() => setBusy(false));
            }}
          >
            <div>
              <Label htmlFor="invite-first">Vorname</Label>
              <Input
                id="invite-first"
                value={invite.firstName}
                onChange={(e) => setInvite({ ...invite, firstName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="invite-last">Nachname</Label>
              <Input
                id="invite-last"
                value={invite.lastName}
                onChange={(e) => setInvite({ ...invite, lastName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="invite-email">E-Mail</Label>
              <Input
                required
                id="invite-email"
                type="email"
                value={invite.email}
                onChange={(e) => setInvite({ ...invite, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="invite-role">Rolle</Label>
              <select
                id="invite-role"
                className="min-h-10 w-full rounded-md border bg-background px-3"
                value={invite.role}
                onChange={(e) => {
                  const role = e.target.value as UserRole;
                  setInvite({ ...invite, role, financeAccess: role === "ADMIN", organizerId: "" });
                }}
              >
                {Object.entries(roleLabel).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            {invite.role === "ORGANIZER" && (
              <div>
                <Label htmlFor="invite-organizer">Veranstalter</Label>
                <select
                  required
                  id="invite-organizer"
                  className="min-h-10 w-full rounded-md border bg-background px-3"
                  value={invite.organizerId}
                  onChange={(e) => setInvite({ ...invite, organizerId: e.target.value })}
                >
                  <option value="">Auswählen</option>
                  {organizers.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {invite.role !== "ORGANIZER" && (
              <label className="flex items-center gap-2 self-end pb-2 text-sm">
                <input
                  type="checkbox"
                  checked={invite.role === "ADMIN" || invite.financeAccess}
                  disabled={invite.role === "ADMIN"}
                  onChange={(e) => setInvite({ ...invite, financeAccess: e.target.checked })}
                />{" "}
                Finanzen sehen
              </label>
            )}
            <div className="md:col-span-2">
              <Button
                disabled={busy || (invite.role === "ORGANIZER" && !invite.organizerId)}
                type="submit"
              >
                Einladung senden
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRoundCog className="size-4" /> Benutzer verwalten
          </CardTitle>
          <CardDescription>
            Änderungen an Rolle, Status oder Berechtigung widerrufen bestehende Sitzungen sofort.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            {(["ALL", "ACTIVE", "INVITED", "DISABLED"] as const).map((value) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={filter === value ? "default" : "outline"}
                onClick={() => setFilter(value)}
              >
                {value === "ALL" ? "Alle" : statusLabel[value]}
              </Button>
            ))}
          </div>
          <div className="space-y-3">
            {shown.map((user) => {
              const draft: ManagedUser & { password?: string } = drafts[user.id] ?? { ...user };
              return (
                <article key={user.id} className="rounded-lg border p-4">
                  <div className="mb-3 flex flex-wrap items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{user.displayName}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {user.email}
                        {user.pendingEmail ? ` · wartet auf ${user.pendingEmail}` : ""}
                      </p>
                    </div>
                    <span className="rounded-full bg-muted px-2 py-1 text-xs">
                      {statusLabel[user.status]}
                    </span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <Label>E-Mail</Label>
                      <Input
                        type="email"
                        value={draft.email}
                        onChange={(e) =>
                          setDrafts({ ...drafts, [user.id]: { ...draft, email: e.target.value } })
                        }
                      />
                    </div>
                    <div>
                      <Label>Vorname</Label>
                      <Input
                        value={draft.firstName ?? ""}
                        onChange={(e) =>
                          setDrafts({
                            ...drafts,
                            [user.id]: { ...draft, firstName: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Nachname</Label>
                      <Input
                        value={draft.lastName ?? ""}
                        onChange={(e) =>
                          setDrafts({
                            ...drafts,
                            [user.id]: { ...draft, lastName: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Rolle</Label>
                      <select
                        className="min-h-10 w-full rounded-md border bg-background px-2"
                        value={draft.role}
                        onChange={(e) => {
                          const role = e.target.value as UserRole;
                          setDrafts({
                            ...drafts,
                            [user.id]: {
                              ...draft,
                              role,
                              financeAccess: role === "ADMIN",
                              organizerId: role === "ORGANIZER" ? draft.organizerId : null,
                            },
                          });
                        }}
                      >
                        {Object.entries(roleLabel).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <select
                        className="min-h-10 w-full rounded-md border bg-background px-2"
                        value={draft.status}
                        onChange={(e) =>
                          setDrafts({
                            ...drafts,
                            [user.id]: { ...draft, status: e.target.value as UserStatus },
                          })
                        }
                      >
                        {Object.entries(statusLabel).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {draft.role === "ORGANIZER" ? (
                      <div>
                        <Label>Veranstalter</Label>
                        <select
                          className="min-h-10 w-full rounded-md border bg-background px-2"
                          value={draft.organizerId ?? ""}
                          onChange={(e) =>
                            setDrafts({
                              ...drafts,
                              [user.id]: { ...draft, organizerId: e.target.value },
                            })
                          }
                        >
                          <option value="">Auswählen</option>
                          {organizers.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 self-end pb-2 text-sm">
                        <input
                          type="checkbox"
                          disabled={draft.role === "ADMIN"}
                          checked={draft.role === "ADMIN" || draft.financeAccess}
                          onChange={(e) =>
                            setDrafts({
                              ...drafts,
                              [user.id]: { ...draft, financeAccess: e.target.checked },
                            })
                          }
                        />{" "}
                        Finanzen sehen
                      </label>
                    )}
                    <div>
                      <Label>Neues Passwort (optional)</Label>
                      <Input
                        type="password"
                        value={draft.password ?? ""}
                        onChange={(e) =>
                          setDrafts({
                            ...drafts,
                            [user.id]: { ...draft, password: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={busy || (draft.role === "ORGANIZER" && !draft.organizerId)}
                      onClick={() => {
                        setBusy(true);
                        void apiUpdateUser(user.id, {
                          email: draft.email,
                          firstName: draft.firstName,
                          lastName: draft.lastName,
                          role: draft.role,
                          status: draft.status,
                          financeAccess: draft.financeAccess,
                          organizerId: draft.organizerId,
                          ...(draft.password ? { password: draft.password } : {}),
                        })
                          .then(load)
                          .then(() => toast.success("Benutzer gespeichert."))
                          .catch((error) => toast.error(error.message))
                          .finally(() => setBusy(false));
                      }}
                    >
                      <ShieldCheck className="size-4" /> Speichern
                    </Button>
                    {user.status === "INVITED" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            void apiResendInvitation(user.id)
                              .then((result) => copyLink(result.activationUrl))
                              .then(load)
                          }
                        >
                          <RefreshCw className="size-4" /> Neu senden
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void apiRevokeInvitation(user.id).then(load)}
                        >
                          Zurückziehen
                        </Button>
                      </>
                    )}
                    {user.lockedUntil && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void apiUnlockUser(user.id).then(load)}
                      >
                        Sperre aufheben
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
