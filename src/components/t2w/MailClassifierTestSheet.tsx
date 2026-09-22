import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Flag,
  FolderOpen,
  MailCheck,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { T2WEvent } from "@/lib/t2w/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Feld } from "@/components/t2w/DetailKarte";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type ClassificationResult = {
  category: string;
  categoryConfidence: number;
  event: { eventCode: string; name: string; confidence: number } | null;
  isQuestion: boolean;
  questionSummary: string | null;
  reasons: string[];
  reviewRequired: boolean;
  outlookPlan: {
    categories: string[];
    subject: string;
    flag: "flagged" | "notFlagged";
    moveToFolderId: string | null;
    requiresApproval: true;
  };
  forwardPlan: {
    recipient: string | null;
    subject: string;
    summary: string;
    requiresApproval: true;
  } | null;
};

const categoryLabels: Record<string, string> = {
  EVENT_QUESTION: "Eventfrage",
  EVENT_UPDATE: "Eventänderung",
  REGISTRATION: "Anmeldung",
  PARTICIPANTS: "Teilnehmer",
  FINANCE: "Finanzen",
  INVOICE: "Rechnung",
  OFFER_REQUEST: "Angebot / Anfrage",
  SPONSORSHIP: "Sponsoring",
  TECHNICAL: "Technik",
  INTERNAL: "Intern",
  NO_ACTION: "Keine Aktion",
  OTHER: "Sonstiges",
};

function isoDate(date: string) {
  return `${date}T00:00:00.000Z`;
}

function percentage(value: number) {
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)} %`;
}

export function MailClassifierTestSheet({ event }: { event: T2WEvent }) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState("veranstalter@example.com");
  const [to, setTo] = useState("info@time2win.at");
  const [subject, setSubject] = useState(`Frage zu ${event.name}`);
  const [body, setBody] = useState(
    "Können die Startnummern am Freitag bereits ab 15 Uhr ausgegeben werden?",
  );
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function analyse() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/v1/mail-classifier/test", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mail: {
            from: from.trim(),
            to: to
              .split(/[;,]/)
              .map((value) => value.trim())
              .filter(Boolean),
            subject: subject.trim(),
            body: body.trim(),
            receivedAt: new Date().toISOString(),
          },
        }),
      });
      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        const message = Array.isArray(detail?.message)
          ? detail.message.join(", ")
          : detail?.message;
        throw new Error(message || `Analyse fehlgeschlagen (HTTP ${response.status}).`);
      }
      setResult((await response.json()) as ClassificationResult);
    } catch (cause) {
      setResult(null);
      setError(cause instanceof Error ? cause.message : "Analyse fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="outline"
        aria-label="Mail mit Ollama analysieren"
        onClick={() => setOpen(true)}
      >
        <Sparkles className="size-4" aria-hidden="true" />
        Mail analysieren
      </Button>
      <SheetContent
        closeLabel="Mailtest schließen"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl"
      >
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            void analyse();
          }}
        >
          <SheetHeader className="border-b p-5 text-left">
            <SheetTitle className="flex items-center gap-2">
              <MailCheck className="size-5 text-primary" aria-hidden="true" />
              Mail-Klassifizierung testen
            </SheetTitle>
            <SheetDescription>
              Dry-Run gegen alle aktiven Events. Outlook wird nicht verändert und es wird nichts
              versendet.
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
              <p className="flex items-center gap-2 font-semibold text-foreground">
                <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
                Aktueller Event als Arbeitskontext
              </p>
              <p className="mt-1 text-muted-foreground">
                {event.name} · {event.eventcode}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Die Analyse vergleicht trotzdem mit allen aktiven Events, damit ein falsch
                geöffneter Event erkannt werden kann.
              </p>
            </div>

            <section aria-labelledby="mail-test-input-heading" className="space-y-4">
              <h2 id="mail-test-input-heading" className="text-sm font-bold">
                Testmail
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Feld label="Von" htmlFor="mail-test-from">
                  <Input
                    id="mail-test-from"
                    className="h-11"
                    value={from}
                    onChange={(event) => setFrom(event.target.value)}
                    autoComplete="email"
                  />
                </Feld>
                <Feld label="An" htmlFor="mail-test-to" hinweis="mit Komma trennen">
                  <Input
                    id="mail-test-to"
                    className="h-11"
                    value={to}
                    onChange={(event) => setTo(event.target.value)}
                    autoComplete="email"
                  />
                </Feld>
              </div>
              <Feld label="Betreff" htmlFor="mail-test-subject">
                <Input
                  id="mail-test-subject"
                  className="h-11"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                />
              </Feld>
              <Feld label="Mailtext" htmlFor="mail-test-body">
                <Textarea
                  id="mail-test-body"
                  rows={7}
                  className="min-h-40 resize-y"
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                />
              </Feld>
            </section>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
              >
                {error}
              </p>
            )}

            {result && (
              <section aria-labelledby="mail-test-result-heading" className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 id="mail-test-result-heading" className="text-sm font-bold">
                    Vorschlag
                  </h2>
                  <Badge
                    variant={result.reviewRequired ? "outline" : "default"}
                    className={
                      result.reviewRequired ? "border-status-angefragt text-status-angefragt" : ""
                    }
                  >
                    {result.reviewRequired ? "Prüfung nötig" : "Sicherer Vorschlag"}
                  </Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border bg-card p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Kategorie
                    </p>
                    <p className="mt-1 font-semibold">
                      {categoryLabels[result.category] ?? result.category}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Konfidenz {percentage(result.categoryConfidence)}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Event
                    </p>
                    <p className="mt-1 font-semibold">{result.event?.name ?? "Nicht zugeordnet"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {result.event
                        ? `${result.event.eventCode} · ${percentage(result.event.confidence)}`
                        : "Manuelle Prüfung erforderlich"}
                    </p>
                  </div>
                </div>

                {result.reasons.length > 0 && (
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Gründe
                    </p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {result.reasons.map((reason) => (
                        <li key={reason} className="flex gap-2">
                          <CheckCircle2
                            className="mt-0.5 size-4 shrink-0 text-primary"
                            aria-hidden="true"
                          />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="rounded-lg border bg-muted/20 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Vorgeschlagene Outlook-Markierung
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {result.outlookPlan.categories.map((category) => (
                      <Badge key={category} variant="outline">
                        {category}
                      </Badge>
                    ))}
                  </div>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">Betreffvorschlag</dt>
                      <dd className="mt-0.5 break-words font-medium">
                        {result.outlookPlan.subject}
                      </dd>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <dt className="flex items-center gap-1">
                        <Flag className="size-3.5" aria-hidden="true" /> Flag
                      </dt>
                      <dd>
                        {result.outlookPlan.flag === "flagged" ? "Follow-up setzen" : "Kein Flag"}
                      </dd>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <dt className="flex items-center gap-1">
                        <FolderOpen className="size-3.5" aria-hidden="true" /> Ordner
                      </dt>
                      <dd>
                        {result.outlookPlan.moveToFolderId
                          ? "Eventordner vorgeschlagen"
                          : "Nicht verschieben"}
                      </dd>
                    </div>
                  </dl>
                </div>

                {result.isQuestion && (
                  <div className="rounded-lg border border-status-angefragt/40 bg-status-angefragt/5 p-3">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <AlertCircle className="size-4 text-status-angefragt" aria-hidden="true" />
                      Eventfrage erkannt
                    </p>
                    <p className="mt-2 text-sm">{result.questionSummary ?? "Frage erkannt."}</p>
                    {result.forwardPlan && (
                      <div className="mt-3 space-y-2 border-t border-status-angefragt/20 pt-3 text-sm">
                        <p className="flex items-center gap-2 font-semibold">
                          <Send className="size-4" aria-hidden="true" /> Weiterleitungsentwurf
                        </p>
                        <p>
                          <span className="text-muted-foreground">An:</span>{" "}
                          {result.forwardPlan.recipient ?? "Veranstalteradresse fehlt"}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Betreff:</span>{" "}
                          {result.forwardPlan.subject}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Noch nicht freigegeben — kein Versand.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}
          </div>

          <SheetFooter className="flex-row items-center justify-between gap-2 border-t bg-muted/20 p-4">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" aria-hidden="true" /> Dry-Run
            </span>
            <Button type="submit" disabled={loading || !subject.trim() || !body.trim()}>
              <Sparkles className="size-4" aria-hidden="true" />
              {loading ? "Ollama analysiert …" : "Analyse starten"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
