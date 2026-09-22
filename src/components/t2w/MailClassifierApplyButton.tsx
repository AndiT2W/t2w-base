import { useState } from "react";
import { LoaderCircle, Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ApplyResult = {
  total: number;
  updated: number;
  skipped: number;
  failed: number;
};

export function MailClassifierApplyButton({
  eventId,
  messageCount,
  onApplied,
}: {
  eventId: string;
  messageCount: number;
  onApplied: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function apply() {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/mail-classifier/events/${eventId}/apply-prefixes`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("MAIL_PREFIX_APPLY_FAILED");
      const result = (await response.json()) as ApplyResult;
      setOpen(false);
      toast.success(
        result.updated > 0
          ? `${result.updated} Mail${result.updated === 1 ? "" : "s"} mit Eventpräfix versehen.`
          : "Keine Mail mit 100 % Eventtreffer gefunden.",
      );
      onApplied();
    } catch {
      toast.error("Eventpräfixe konnten nicht angewendet werden.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="outline"
        aria-label="Eventpräfixe auf E-Mails anwenden"
        disabled={messageCount === 0 || loading}
        onClick={() => setOpen(true)}
      >
        {loading ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Tag className="size-4" aria-hidden="true" />
        )}
        Präfixe anwenden
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eventpräfixe anwenden?</AlertDialogTitle>
          <AlertDialogDescription>
            Die {messageCount} synchronisierten E-Mails dieses Events werden mit Ollama geprüft. Nur
            ein exakter Eventtreffer mit 100 % Konfidenz erhält den Präfix
            <span className="font-medium text-foreground"> [Eventname]</span>. Unsichere Mails
            bleiben unverändert.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Abbrechen</AlertDialogCancel>
          <AlertDialogAction disabled={loading} onClick={() => void apply()}>
            {loading ? "Prüfe …" : "Präfixe anwenden"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
