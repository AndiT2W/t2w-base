import type { CrmModule, CrmState, KundeInput, PersonInput } from "./module";
import type { Kunde, Person } from "./types";

export type CrmStorage = Pick<Storage, "getItem" | "setItem">;
const clone = <T>(value: T): T => structuredClone(value);
const EMPTY_CRM_STATE: CrmState = { personen: [], kunden: [] };

export function createLocalCrmAdapter(
  storage: CrmStorage,
  key = "t2w-crm-v2",
  seed: CrmState = EMPTY_CRM_STATE,
): CrmModule {
  const read = (): CrmState => {
    const saved = storage.getItem(key);
    if (!saved) {
      const initial = clone(seed);
      storage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    const state = JSON.parse(saved) as CrmState;
    const normalized = {
      ...state,
      kunden: state.kunden.map((kunde) =>
        (kunde.status as string) === "pruefung" ? { ...kunde, status: "aktiv" as const } : kunde,
      ),
    };
    if (JSON.stringify(normalized) !== saved) storage.setItem(key, JSON.stringify(normalized));
    return normalized;
  };
  const write = (state: CrmState) => {
    storage.setItem(key, JSON.stringify(state));
    return clone(state);
  };
  const id = (prefix: string) => `${prefix}_${globalThis.crypto?.randomUUID?.() ?? Date.now()}`;

  return {
    async load() {
      return clone(read());
    },
    async link(personId, kundeId) {
      const state = read();
      write({
        personen: state.personen.map((person) =>
          person.id === personId && !person.kundenIds.includes(kundeId)
            ? { ...person, kundenIds: [...person.kundenIds, kundeId] }
            : person,
        ),
        kunden: state.kunden.map((kunde) =>
          kunde.id === kundeId && !kunde.kontaktIds.includes(personId)
            ? { ...kunde, kontaktIds: [...kunde.kontaktIds, personId] }
            : kunde,
        ),
      });
    },
    async unlink(personId, kundeId) {
      const state = read();
      write({
        personen: state.personen.map((person) =>
          person.id === personId
            ? { ...person, kundenIds: person.kundenIds.filter((id) => id !== kundeId) }
            : person,
        ),
        kunden: state.kunden.map((kunde) =>
          kunde.id === kundeId
            ? { ...kunde, kontaktIds: kunde.kontaktIds.filter((id) => id !== personId) }
            : kunde,
        ),
      });
    },
    async createPerson(input: PersonInput) {
      const person: Person = { ...input, id: id("person"), kundenprofilId: null, eventRollen: [] };
      const state = read();
      write({ ...state, personen: [...state.personen, person] });
      return clone(person);
    },
    async createKunde(input: KundeInput) {
      const kunde: Kunde = {
        ...input,
        id: id("kunde"),
        kontaktIds: input.personId ? [input.personId] : [],
        events: [],
      };
      const state = read();
      write({
        personen: state.personen.map((person) =>
          input.personId === person.id
            ? {
                ...person,
                kundenprofilId: kunde.id,
                kundenIds: [...new Set([...person.kundenIds, kunde.id])],
              }
            : person,
        ),
        kunden: [...state.kunden, kunde],
      });
      return clone(kunde);
    },
    async updatePerson(person, patch) {
      const next = { ...person, ...patch };
      const state = read();
      write({
        ...state,
        personen: state.personen.map((item) => (item.id === person.id ? next : item)),
      });
      return clone(next);
    },
    async updateKunde(kunde, patch) {
      const next = { ...kunde, ...patch };
      const state = read();
      write({ ...state, kunden: state.kunden.map((item) => (item.id === kunde.id ? next : item)) });
      return clone(next);
    },
    async deletePerson(person) {
      const state = read();
      if (person.kundenIds.length || person.eventRollen.length || person.kundenprofilId)
        throw new Error("CRM_REFERENCED");
      write({ ...state, personen: state.personen.filter((item) => item.id !== person.id) });
    },
    async deleteKunde(kunde) {
      const state = read();
      if (
        kunde.kontaktIds.length ||
        kunde.events.length ||
        kunde.personId ||
        kunde.primaryContactId
      )
        throw new Error("CRM_REFERENCED");
      write({ ...state, kunden: state.kunden.filter((item) => item.id !== kunde.id) });
    },
  };
}

export function createBrowserLocalCrmAdapter() {
  return createLocalCrmAdapter({
    getItem: (key) => globalThis.localStorage.getItem(key),
    setItem: (key, value) => globalThis.localStorage.setItem(key, value),
  });
}
