import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEMO_KUNDEN, DEMO_PERSONEN } from "./demo";
import { personName, type Kunde, type Person } from "./types";
type Ctx = {
  personen: Person[];
  kunden: Kunde[];
  neuePerson: (p: Omit<Person, "id" | "kundenprofilId" | "eventRollen">) => Person;
  neuerKunde: (
    k: Omit<Kunde, "id" | "kontaktIds" | "events" | "personId"> & { personId?: string | null },
  ) => void;
  personAlsKunde: (
    id: string,
    k: Omit<Kunde, "id" | "name" | "personId" | "kontaktIds" | "events" | "typ">,
  ) => void;
  updatePerson: (id: string, p: Partial<Person>) => void;
  updateKunde: (id: string, p: Partial<Kunde>) => void;
  verknuepfe: (personId: string, kundeId: string) => void;
  loeseVerknuepfung: (personId: string, kundeId: string) => void;
  kundenVonPerson: (p: Person) => Kunde[];
  kontakteVonKunde: (id: string) => Person[];
  findeDublette: (v: string, n: string, e: string) => Person | undefined;
};
const Ctx = createContext<Ctx | null>(null);
const KEY = "t2w-crm-v1";
export function CrmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState({ personen: DEMO_PERSONEN, kunden: DEMO_KUNDEN });
  const [bereit, setBereit] = useState(false);
  useEffect(() => {
    try {
      const x = localStorage.getItem(KEY);
      if (x) setState(JSON.parse(x));
    } catch {
      // Ignore malformed or unavailable local storage and keep demo data.
    } finally {
      setBereit(true);
    }
  }, []);
  useEffect(() => {
    if (!bereit) return;
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, bereit]);
  const value = useMemo<Ctx>(
    () => ({
      ...state,
      neuePerson: (input) => {
        const person: Person = {
          ...input,
          id: `p_${Date.now()}`,
          kundenprofilId: null,
          eventRollen: [],
        };
        setState((s) => ({ ...s, personen: [...s.personen, person] }));
        return person;
      },
      neuerKunde: (k) =>
        setState((s) => ({
          ...s,
          kunden: [
            ...s.kunden,
            {
              ...k,
              id: `c_${Date.now()}`,
              personId: k.personId ?? null,
              kontaktIds: [],
              events: [],
            },
          ],
        })),
      personAlsKunde: (id, k) =>
        setState((s) => {
          const p = s.personen.find((x) => x.id === id);
          const cid = `c_${Date.now()}`;
          return {
            personen: s.personen.map((x) =>
              x.id === id ? { ...x, kundenprofilId: cid, kundenIds: [...x.kundenIds, cid] } : x,
            ),
            kunden: [
              ...s.kunden,
              {
                ...k,
                id: cid,
                name: p ? personName(p) : "",
                typ: "person",
                personId: id,
                kontaktIds: [id],
                events: [],
              },
            ],
          };
        }),
      updatePerson: (id, p) =>
        setState((s) => ({
          ...s,
          personen: s.personen.map((x) => (x.id === id ? { ...x, ...p } : x)),
        })),
      updateKunde: (id, p) =>
        setState((s) => ({
          ...s,
          kunden: s.kunden.map((x) => (x.id === id ? { ...x, ...p } : x)),
        })),
      verknuepfe: (pid, cid) =>
        setState((s) => ({
          personen: s.personen.map((p) =>
            p.id === pid && !p.kundenIds.includes(cid)
              ? { ...p, kundenIds: [...p.kundenIds, cid] }
              : p,
          ),
          kunden: s.kunden.map((k) =>
            k.id === cid && !k.kontaktIds.includes(pid)
              ? { ...k, kontaktIds: [...k.kontaktIds, pid] }
              : k,
          ),
        })),
      loeseVerknuepfung: (pid, cid) =>
        setState((s) => ({
          personen: s.personen.map((p) =>
            p.id === pid ? { ...p, kundenIds: p.kundenIds.filter((id) => id !== cid) } : p,
          ),
          kunden: s.kunden.map((k) =>
            k.id === cid ? { ...k, kontaktIds: k.kontaktIds.filter((id) => id !== pid) } : k,
          ),
        })),
      kundenVonPerson: (p) => state.kunden.filter((k) => p.kundenIds.includes(k.id)),
      kontakteVonKunde: (id) => state.personen.filter((p) => p.kundenIds.includes(id)),
      findeDublette: (v, n, e) =>
        state.personen.find(
          (p) =>
            p.email.toLowerCase() === e.toLowerCase() ||
            (personName(p).toLowerCase() === `${v} ${n}`.trim().toLowerCase() && !!v && !!n),
        ),
    }),
    [state],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useCrm() {
  const v = useContext(Ctx);
  if (!v) throw new Error("CrmProvider fehlt");
  return v;
}
export const passtPerson = (p: Person, q: string, k: Kunde[]) =>
  `${personName(p)} ${p.email} ${p.telefon} ${p.funktion} ${k
    .filter((x) => p.kundenIds.includes(x.id))
    .map((x) => `${x.name} ${x.uid} ${x.iban}`)
    .join(" ")}`
    .toLowerCase()
    .includes(q.toLowerCase());
export const passtKunde = (k: Kunde, q: string) =>
  `${k.name} ${k.uid} ${k.iban} ${k.rechnungsEmail}`.toLowerCase().includes(q.toLowerCase());
