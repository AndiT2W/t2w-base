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
import { type Kunde, type Person } from "./types";
import { createCrmLifecycle } from "./lifecycle";

type Ctx = CrmState & {
  bereit: boolean;
  fehler: string | null;
  neuLaden: () => Promise<void>;
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
  deletePerson: (id: string) => Promise<void>;
  deleteKunde: (id: string) => Promise<void>;
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
  const lifecycle = useMemo(() => createCrmLifecycle(workspace), [workspace]);
  const state = useSyncExternalStore(workspace.subscribe, workspace.snapshot, workspace.snapshot);
  useEffect(() => {
    void workspace.load().catch(() => undefined);
  }, [workspace]);
  const value = useMemo<Ctx>(
    () => ({
      ...state,
      neuLaden: async () => {
        await lifecycle.reload();
      },
      neuePerson: lifecycle.createPerson,
      neuerKunde: lifecycle.createCustomer,
      personAlsKunde: lifecycle.createCustomerForPerson,
      neuePersonAlsKunde: lifecycle.createPersonAndCustomer,
      updatePerson: lifecycle.updatePerson,
      updateKunde: lifecycle.updateCustomer,
      deletePerson: lifecycle.deletePerson,
      deleteKunde: lifecycle.deleteCustomer,
      verknuepfe: lifecycle.link,
      loeseVerknuepfung: lifecycle.unlink,
      kundenVonPerson: lifecycle.customersForPerson,
      kontakteVonKunde: lifecycle.contactsForCustomer,
      findeDublette: lifecycle.findDuplicate,
    }),
    [state, lifecycle],
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
