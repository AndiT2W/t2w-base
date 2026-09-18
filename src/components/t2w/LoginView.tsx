import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  apiActivate,
  apiCompletePasswordReset,
  apiConfirmEmailChange,
  apiLogin,
  apiRequestPasswordReset,
} from "@/lib/t2w/api";

export function LoginView({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("admin@time2win.cloud");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const parameters = new URLSearchParams(window.location.search);
  const inviteToken = parameters.get("invite");
  const resetToken = parameters.get("reset");
  const emailChangeToken = parameters.get("emailChange");
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      if (inviteToken) await apiActivate(inviteToken, password, firstName, lastName);
      else if (resetToken) await apiCompletePasswordReset(resetToken, password);
      else if (emailChangeToken) {
        await apiConfirmEmailChange(emailChangeToken);
        window.history.replaceState({}, "", "/");
        setMessage("E-Mail-Adresse bestätigt. Bitte neu anmelden.");
        return;
      } else if (forgot) {
        await apiRequestPasswordReset(email);
        setMessage("Falls das Konto aktiv ist, wurde ein Reset-Link versendet.");
        return;
      } else await apiLogin(email, password, rememberMe);
      if (inviteToken || resetToken) window.history.replaceState({}, "", "/");
      onLogin();
    } catch (value) {
      setError(value instanceof Error ? value.message : "Aktion fehlgeschlagen.");
    }
  };
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-5 rounded-xl border bg-background p-6 shadow-sm"
      >
        <div>
          <h1 className="text-xl font-semibold">TIME2WIN Eventverwaltung</h1>
          <p className="text-sm text-muted-foreground">
            {inviteToken
              ? "Konto aktivieren"
              : resetToken
                ? "Neues Passwort festlegen"
                : emailChangeToken
                  ? "Neue E-Mail-Adresse bestätigen"
                  : forgot
                    ? "Passwort zurücksetzen"
                    : "Bitte anmelden, um fortzufahren."}
          </p>
        </div>
        {inviteToken && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="first-name">Vorname</Label>
              <Input
                id="first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-name">Nachname</Label>
              <Input
                id="last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
        )}
        {!inviteToken && !resetToken && !emailChangeToken && (
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        )}
        {!forgot && !emailChangeToken && (
          <div className="space-y-2">
            <Label htmlFor="password">Passwort</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Mindestens 10 Zeichen, Groß-/Kleinbuchstaben und eine Zahl.
            </p>
          </div>
        )}
        {!inviteToken && !resetToken && !emailChangeToken && !forgot && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            Angemeldet bleiben
          </label>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {message && <p className="text-sm text-emerald-700">{message}</p>}
        <Button type="submit" className="w-full">
          {inviteToken
            ? "Konto aktivieren"
            : resetToken
              ? "Passwort speichern"
              : emailChangeToken
                ? "E-Mail bestätigen"
                : forgot
                  ? "Reset-Link senden"
                  : "Anmelden"}
        </Button>
        {!inviteToken && !resetToken && !emailChangeToken && (
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => {
              setForgot((value) => !value);
              setError("");
              setMessage("");
            }}
          >
            {forgot ? "Zur Anmeldung" : "Passwort vergessen?"}
          </Button>
        )}
      </form>
    </main>
  );
}
