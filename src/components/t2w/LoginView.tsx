import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiLogin } from "@/lib/t2w/api";

export function LoginView({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("admin@time2win.cloud");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setError(""); try { await apiLogin(email, password); onLogin(); } catch { setError("Anmeldung fehlgeschlagen."); } };
  return <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6"><form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-xl border bg-background p-6 shadow-sm"><div><h1 className="text-xl font-semibold">TIME2WIN Eventverwaltung</h1><p className="text-sm text-muted-foreground">Bitte anmelden, um Events zu verwalten.</p></div><div className="space-y-2"><Label htmlFor="email">E-Mail</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="password">Passwort</Label><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>{error && <p className="text-sm text-destructive">{error}</p>}<Button type="submit" className="w-full">Anmelden</Button></form></main>;
}
