import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  apiChangePassword,
  apiRequestEmailChange,
  apiUpdateProfile,
  type CurrentUser,
} from "@/lib/t2w/api";

export function AccountDialog({
  user,
  open,
  onOpenChange,
}: {
  user: CurrentUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [email, setEmail] = useState(user.pendingEmail ?? user.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const run = (work: () => Promise<unknown>, success: string, reload = false) => {
    setBusy(true);
    void work()
      .then(() => {
        toast.success(success);
        if (reload) window.location.reload();
      })
      .catch((error) => toast.error(error.message))
      .finally(() => setBusy(false));
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Mein Konto</DialogTitle>
          <DialogDescription>Profil, Anmeldeadresse und Passwort verwalten.</DialogDescription>
        </DialogHeader>
        <section className="space-y-3 border-t pt-4">
          <h3 className="font-medium">Profil</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="profile-first">Vorname</Label>
              <Input
                id="profile-first"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="profile-last">Nachname</Label>
              <Input
                id="profile-last"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
          <Button
            size="sm"
            disabled={busy}
            onClick={() =>
              run(() => apiUpdateProfile(firstName, lastName), "Profil gespeichert.", true)
            }
          >
            Profil speichern
          </Button>
        </section>
        <section className="space-y-3 border-t pt-4">
          <h3 className="font-medium">E-Mail-Adresse</h3>
          <p className="text-xs text-muted-foreground">
            Die neue Adresse wird erst nach Bestätigung aktiv.
          </p>
          <Label htmlFor="profile-email">Neue E-Mail-Adresse</Label>
          <Input
            id="profile-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={busy || email === user.email}
            onClick={() => run(() => apiRequestEmailChange(email), "Bestätigungslink versendet.")}
          >
            Bestätigung senden
          </Button>
        </section>
        <section className="space-y-3 border-t pt-4">
          <h3 className="font-medium">Passwort ändern</h3>
          <div>
            <Label htmlFor="current-password">Aktuelles Passwort</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="new-password">Neues Passwort</Label>
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={busy || !currentPassword || !password}
            onClick={() =>
              run(
                () => apiChangePassword(currentPassword, password),
                "Passwort geändert. Bitte neu anmelden.",
                true,
              )
            }
          >
            Passwort ändern
          </Button>
        </section>
      </DialogContent>
    </Dialog>
  );
}
