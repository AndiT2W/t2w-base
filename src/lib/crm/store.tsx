import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createHttpCrmAdapter, type CrmModule, type CrmState } from "./module";
import { createCrmWorkspace } from "./workspace";
import { createBrowserLocalCrmAdapter } from "./local-adapter";
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
  neuePersonAlsKunde: (
    p: Omit<Person, "id" | "kundenprofilId" | "eventRollen">,
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

export function CrmProvider({ children, adapter }: { children: ReactNode; adapter?: CrmModule }) {
  const persistence = useMemo(
    () =>
      adapter ??
      (import.meta.env.VITE_CRM_ADAPTER === "local"
        ? createBrowserLocalCrmAdapter()
        : createHttpCrmAdapter()),
    [adapter],
  );
  const workspace = useMemo(() => createCrmWorkspace(persistence), [persistence]);
  const state = useSyncExternalStore(workspace.subscribe, workspace.snapshot, workspace.snapshot);
  useEffect(() => {
    void workspace.load().catch(() => undefined);
  }, [workspace]);
  const value = useMemo<Ctx>(
    () => ({
      ...state,
      neuePerson: workspace.createPerson,
      neuerKunde: async (input) => {
        await workspace.createKunde({
          ...input,
          personId: input.personId ?? null,
          kontaktIds: [],
          events: [],
        });
      },
      personAlsKunde: async (id, input) => {
        const person = workspace.snapshot().personen.find((item) => item.id === id);
        if (!person) throw new Error("PERSON_NOT_FOUND");
        await workspace.createKunde({
          ...input,
          name: personName(person),
          typ: "person",
          personId: id,
          kontaktIds: [],
          events: [],
        });
      },
      neuePersonAlsKunde: async (person, kunde) => {
        await workspace.createPersonAndKunde(person, {
          ...kunde,
          typ: "person",
          kontaktIds: [],
          events: [],
        });
      },
      updatePerson: workspace.updatePerson,
      updateKunde: workspace.updateKunde,
      verknuepfe: workspace.link,
      loeseVerknuepfung: workspace.unlink,
      kundenVonPerson: workspace.kundenVonPerson,
      kontakteVonKunde: workspace.kontakteVonKunde,
      findeDublette: workspace.findDuplicate,
    }),
    [state, workspace],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useCrm() {
  const value = useContext(Ctx);
  if (!value) throw new Error("CrmProvider fehlt");
  return value;
}
export const passtPerson = (person: Person, query: string, kunden: Kunde[]) =>
  `${personName(person)} ${person.email} ${person.telefonPrivat} ${person.telefonBeruflich} ${person.funktion} ${person.ort} ${kunden
    .filter((kunde) => person.kundenIds.includes(kunde.id))
    .map((kunde) => `${kunde.name} ${kunde.uid} ${kunde.iban}`)
    .join(" ")}`
    .toLowerCase()
    .includes(query.toLowerCase());
export const passtKunde = (kunde: Kunde, query: string) =>
  `${kunde.name} ${kunde.uid} ${kunde.iban} ${kunde.email} ${kunde.ort} ${kunde.plz}`
    .toLowerCase()
    .includes(query.toLowerCase());
