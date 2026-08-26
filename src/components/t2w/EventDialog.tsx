import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT2W } from "@/lib/t2w/store";
import { useCrm } from "@/lib/crm/store";
import { apiSports, type ApiSport } from "@/lib/t2w/api";
import { buildEventcode } from "@/lib/t2w/eventcode";
import { STATUS_ORDER, STATUS_LABEL, type EventStatus } from "@/lib/t2w/types";

export function EventDialog({ trigger }: { trigger: React.ReactNode }) {
  const { events, neuesEvent } = useT2W();
  const { kunden } = useCrm();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [veranstalter, setVeranstalter] = useState("");
  const [veranstalterId, setVeranstalterId] = useState<string | undefined>();
  const [veranstalterSuche, setVeranstalterSuche] = useState("");
  const [sportartId, setSportartId] = useState<string | undefined>();
  const [sportarten, setSportarten] = useState<ApiSport[]>([]);
  const [ort, setOrt] = useState("");
  const [start, setStart] = useState("");
  const [eventcode, setEventcode] = useState("");
  const [eventcodeManuell, setEventcodeManuell] = useState(false);
  const [ende, setEnde] = useState("");
  const [status, setStatus] = useState<EventStatus>("anfrage");
  const [notizen, setNotizen] = useState("");
  useEffect(() => { void apiSports().then(setSportarten).catch(() => setSportarten([])); }, []);

  const vorschau =
    name.trim() && start
      ? buildEventcode(
          name.trim(),
          start,
          events.map((e) => e.eventcode),
        )
      : "wird automatisch erzeugt";

  function reset() {
    setName("");
    setVeranstalter("");
    setVeranstalterId(undefined);
    setVeranstalterSuche("");
    setSportartId(undefined);
    setOrt("");
    setStart("");
    setEventcode("");
    setEventcodeManuell(false);
    setEnde("");
    setStatus("anfrage");
    setNotizen("");
  }

  async function speichern() {
    if (!name.trim()) {
      toast.error("Bitte einen Eventnamen angeben.");
      return;
    }
    if (!start) {
      toast.error("Das Startdatum ist verpflichtend.");
      return;
    }
    if (!veranstalterId) { toast.error("Bitte einen Veranstalter auswählen."); return; }
    if (!sportartId) { toast.error("Bitte eine Sportart auswählen."); return; }
    if (ende && ende < start) {
      toast.error("Das Enddatum darf nicht vor dem Startdatum liegen.");
      return;
    }
    const ev = await neuesEvent({
      name: name.trim(),
      eventcode: eventcode.trim() || vorschau,
      veranstalter: veranstalter.trim() || "—",
      veranstalterId,
      sportartId,
      ort: ort.trim() || "—",
      start,
      ende,
      status,
      notizen: notizen.trim(),
    });
    toast.success(`Event angelegt: ${ev.eventcode}`);
    setOpen(false);
    reset();
    navigate({ to: "/events/$eventcode", params: { eventcode: ev.eventcode } });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Neues Event anlegen</DialogTitle>
          <DialogDescription>
            Der Eventcode wird automatisch erzeugt und ist danach unveränderlich.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="name">Eventname *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                const value = e.target.value;
                setName(value);
                if (!eventcodeManuell && start)
                  setEventcode(
                    value.trim()
                      ? buildEventcode(
                          value.trim(),
                          start,
                          events.map((item) => item.eventcode),
                        )
                      : "",
                  );
              }}
              placeholder="z. B. Sommerfest Nordwerk 2026"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="veranstalter">Veranstalter</Label>
            <Input aria-label="Veranstalter aus Stammdaten" placeholder="Kunde suchen …" value={veranstalterId ? veranstalter : veranstalterSuche} onChange={(e) => { setVeranstalterSuche(e.target.value); setVeranstalterId(undefined); setVeranstalter(""); }} className="mt-1.5" />
            {veranstalterSuche && !veranstalterId && <div className="mt-1 max-h-32 overflow-y-auto rounded-md border border-border bg-surface">{kunden.filter((kunde) => kunde.name.toLocaleLowerCase("de").includes(veranstalterSuche.toLocaleLowerCase("de"))).map((kunde) => <button type="button" key={kunde.id} className="block w-full px-3 py-2 text-left text-sm hover:bg-accent" onClick={() => { setVeranstalterId(kunde.id); setVeranstalter(kunde.name); setVeranstalterSuche(""); }}>{kunde.name}</button>)}</div>}
          </div>
          <div>
            <Label>Sportart *</Label>
            <Select value={sportartId} onValueChange={setSportartId}><SelectTrigger aria-label="Sportart" className="mt-1.5"><SelectValue placeholder="Sportart auswählen" /></SelectTrigger><SelectContent>{sportarten.map((sport) => <SelectItem key={sport.id} value={sport.id}>{sport.name}</SelectItem>)}</SelectContent></Select>
          </div>
          <div>
            <Label htmlFor="ort">Ort</Label>
            <Input
              id="ort"
              value={ort}
              onChange={(e) => setOrt(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="start">Startdatum *</Label>
            <Input
              id="start"
              type="date"
              value={start}
              onChange={(e) => {
                const value = e.target.value;
                setStart(value);
                if (!eventcodeManuell && name.trim() && value)
                  setEventcode(
                    buildEventcode(
                      name.trim(),
                      value,
                      events.map((item) => item.eventcode),
                    ),
                  );
              }}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="ende">Enddatum (optional)</Label>
            <Input
              id="ende"
              type="date"
              value={ende}
              onChange={(e) => setEnde(e.target.value)}
              className="mt-1.5"
            />
            <p className="mt-1 text-xs text-muted-foreground">Leer = entspricht dem Startdatum.</p>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as EventStatus)}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="notizen">Notizen</Label>
            <Textarea
              id="notizen"
              value={notizen}
              onChange={(e) => setNotizen(e.target.value)}
              className="mt-1.5"
              rows={3}
            />
          </div>
          <div className="sm:col-span-2 rounded-md border border-border bg-secondary px-3 py-2">
            <p className="text-xs text-muted-foreground">Eventcode-Vorschau</p>
            <Input
              aria-label="Eventcode-Vorschau"
              value={eventcode || vorschau}
              onChange={(e) => {
                setEventcode(e.target.value);
                setEventcodeManuell(true);
              }}
              className="mt-1 font-mono text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Abbrechen
          </Button>
          <Button onClick={speichern}>Event anlegen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
