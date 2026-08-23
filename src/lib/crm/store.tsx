import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createHttpCrmAdapter, type CrmModule, type CrmState } from "./module";
import { personName, type Kunde, type Person } from "./types";

type Ctx = CrmState & {
  bereit: boolean;
  fehler: string | null;
  neuePerson: (p: Omit<Person, "id" | "kundenprofilId" | "eventRollen">) => Promise<Person>;
  neuerKunde: (
    k: Omit<Kunde, "id" | "kontaktIds" | "events" | "personId"> & { personId?: string | null },
  ) => Promise<void>;
  personAlsKunde: (
    id: string,
    k: Omit<Kunde, "id" | "name" | "personId" | "kontaktIds" | "events" | "typ">,
  ) => Promise<void>;
  updatePerson: (id: string, p: Partial<Person>) => Promise<void>;
  updateKunde: (id: string, p: Partial<Kunde>) => Promise<void>;
  verknuepfe: (personId: string, kundeId: string) => Promise<void>;
  loeseVerknuepfung: (personId: string, kundeId: string) => Promise<void>;
  kundenVonPerson: (p: Person) => Kunde[];
  kontakteVonKunde: (id: string) => Person[];
  findeDublette: (v: string, n: string, e: string) => Person | undefined;
};
const Ctx = createContext<Ctx | null>(null);
const initial: CrmState = { personen: [], kunden: [] };

export function CrmProvider({ children, adapter }: { children: ReactNode; adapter?: CrmModule }) {
  const [state, setState] = useState(initial);
  const [bereit, setBereit] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const crm = useMemo(() => adapter ?? createHttpCrmAdapter(), [adapter]);
  useEffect(() => {
    void crm
      .load()
      .then(setState)
      .catch(() => setFehler("Kunden und Kontakte konnten nicht geladen werden."))
      .finally(() => setBereit(true));
  }, [crm]);

  const commit = useCallback(
    async (operation: (current: CrmState) => Promise<CrmState>) => {
      setFehler(null);
      try {
        setState(await operation(state));
      } catch (error) {
        setFehler("Änderung konnte nicht gespeichert werden.");
        throw error;
      }
    },
    [state],
  );

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      bereit,
      fehler,
      neuePerson: async (input) => {
        const person = await crm.createPerson(input);
        setState((current) => ({ ...current, personen: [...current.personen, person] }));
        return person;
      },
      neuerKunde: async (input) => {
        const kunde = await crm.createKunde({
          ...input,
          personId: input.personId ?? null,
          kontaktIds: [],
          events: [],
        });
        setState((current) => ({ ...current, kunden: [...current.kunden, kunde] }));
      },
      personAlsKunde: async (id, input) => {
        const person = state.personen.find((item) => item.id === id);
        if (!person) throw new Error("PERSON_NOT_FOUND");
        const kunde = await crm.createKunde({
          ...input,
          name: personName(person),
          typ: "person",
          personId: id,
          kontaktIds: [],
          events: [],
        });
        setState((current) => ({
          personen: current.personen.map((item) =>
            item.id === id
              ? {
                  ...item,
                  kundenprofilId: kunde.id,
                  kundenIds: [...new Set([...item.kundenIds, kunde.id])],
                }
              : item,
          ),
          kunden: [...current.kunden, { ...kunde, kontaktIds: [id] }],
        }));
      },
      updatePerson: async (id, patch) => {
        const person = state.personen.find((item) => item.id === id);
        if (!person) return;
        const saved = await crm.updatePerson(person, patch);
        setState((current) => ({
          ...current,
          personen: current.personen.map((item) =>
            item.id === id
              ? { ...item, ...saved, kundenIds: item.kundenIds, eventRollen: item.eventRollen }
              : item,
          ),
        }));
      },
      updateKunde: async (id, patch) => {
        const kunde = state.kunden.find((item) => item.id === id);
        if (!kunde) return;
        const saved = await crm.updateKunde(kunde, patch);
        setState((current) => ({
          ...current,
          kunden: current.kunden.map((item) =>
            item.id === id
              ? { ...item, ...saved, kontaktIds: item.kontaktIds, events: item.events }
              : item,
          ),
        }));
      },
      verknuepfe: (personId, kundeId) => commit((current) => crm.link(current, personId, kundeId)),
      loeseVerknuepfung: (personId, kundeId) =>
        commit((current) => crm.unlink(current, personId, kundeId)),
      kundenVonPerson: (person) =>
        state.kunden.filter((kunde) => person.kundenIds.includes(kunde.id)),
      kontakteVonKunde: (id) => state.personen.filter((person) => person.kundenIds.includes(id)),
      findeDublette: (vorname, nachname, email) =>
        state.personen.find(
          (person) =>
            person.email.toLowerCase() === email.toLowerCase() ||
            (personName(person).toLowerCase() === `${vorname} ${nachname}`.trim().toLowerCase() &&
              !!vorname &&
              !!nachname),
        ),
    }),
    [state, bereit, fehler, crm, commit],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useCrm() {
  const value = useContext(Ctx);
  if (!value) throw new Error("CrmProvider fehlt");
  return value;
}
export const passtPerson = (person: Person, query: string, kunden: Kunde[]) =>
  `${personName(person)} ${person.email} ${person.telefon} ${person.funktion} ${kunden
    .filter((kunde) => person.kundenIds.includes(kunde.id))
    .map((kunde) => `${kunde.name} ${kunde.uid} ${kunde.iban}`)
    .join(" ")}`
    .toLowerCase()
    .includes(query.toLowerCase());
export const passtKunde = (kunde: Kunde, query: string) =>
  `${kunde.name} ${kunde.uid} ${kunde.iban} ${kunde.rechnungsEmail}`
    .toLowerCase()
    .includes(query.toLowerCase());
