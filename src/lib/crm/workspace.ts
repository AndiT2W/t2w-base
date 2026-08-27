import type { CrmModule, CrmState, KundeInput, PersonInput } from "./module";
import { personName, type Kunde, type Person } from "./types";

export function createCrmWorkspace(adapter: CrmModule) {
  let state: CrmState = { personen: [], kunden: [] };
  let ready = false;
  let error: string | null = null;
  let snapshot = { ...state, bereit: ready, fehler: error };
  const subscribers = new Set<() => void>();
  const publish = () => {
    snapshot = { ...state, bereit: ready, fehler: error };
    subscribers.forEach((subscriber) => subscriber());
  };
  const replace = (next: CrmState) => {
    state = next;
    publish();
  };
  const fail = (message: string, cause: unknown): never => {
    error = message;
    publish();
    throw cause;
  };
  const mutate = async (operation: () => Promise<CrmState>) => {
    error = null;
    try {
      replace(await operation());
    } catch (cause) {
      fail("Änderung konnte nicht gespeichert werden.", cause);
    }
  };
  const findDuplicate = (vorname: string, nachname: string, email: string) =>
    state.personen.find(
      (person) =>
        person.email.toLowerCase() === email.toLowerCase() ||
        (personName(person).toLowerCase() === `${vorname} ${nachname}`.trim().toLowerCase() &&
          !!vorname &&
          !!nachname),
    );

  return {
    snapshot: () => snapshot,
    subscribe(subscriber: () => void) {
      subscribers.add(subscriber);
      return () => {
        subscribers.delete(subscriber);
      };
    },
    async load() {
      try {
        replace(await adapter.load());
      } catch (cause) {
        error = "Kunden und Kontakte konnten nicht geladen werden.";
        throw cause;
      } finally {
        ready = true;
        publish();
      }
    },
    async createPerson(input: PersonInput) {
      try {
        const person = await adapter.createPerson(input);
        replace({ ...state, personen: [...state.personen, person] });
        return person;
      } catch (cause) {
        return fail("Änderung konnte nicht gespeichert werden.", cause);
      }
    },
    async createKunde(input: KundeInput) {
      try {
        const kunde = await adapter.createKunde(input);
        const personen = input.personId
          ? state.personen.map((person) =>
              person.id === input.personId
                ? {
                    ...person,
                    kundenprofilId: kunde.id,
                    kundenIds: [...new Set([...person.kundenIds, kunde.id])],
                  }
                : person,
            )
          : state.personen;
        replace({
          personen,
          kunden: [
            ...state.kunden,
            { ...kunde, kontaktIds: input.personId ? [input.personId] : kunde.kontaktIds },
          ],
        });
        return kunde;
      } catch (cause) {
        return fail("Änderung konnte nicht gespeichert werden.", cause);
      }
    },
    async createPersonAndKunde(
      personInput: PersonInput,
      kundeInput: Omit<KundeInput, "name" | "personId">,
    ) {
      const existing = findDuplicate(personInput.vorname, personInput.nachname, personInput.email);
      const person = existing ?? (await this.createPerson(personInput));
      await this.createKunde({ ...kundeInput, name: personName(person), personId: person.id });
      return person;
    },
    async updatePerson(id: string, patch: Partial<Person>) {
      const person = state.personen.find((item) => item.id === id);
      if (!person) return;
      try {
        const saved = await adapter.updatePerson(person, patch);
        replace({
          ...state,
          personen: state.personen.map((item) =>
            item.id === id
              ? { ...item, ...saved, kundenIds: item.kundenIds, eventRollen: item.eventRollen }
              : item,
          ),
        });
      } catch (cause) {
        fail("Änderung konnte nicht gespeichert werden.", cause);
      }
    },
    async updateKunde(id: string, patch: Partial<Kunde>) {
      const kunde = state.kunden.find((item) => item.id === id);
      if (!kunde) return;
      try {
        const saved = await adapter.updateKunde(kunde, patch);
        replace({
          ...state,
          kunden: state.kunden.map((item) =>
            item.id === id
              ? { ...item, ...saved, kontaktIds: item.kontaktIds, events: item.events }
              : item,
          ),
        });
      } catch (cause) {
        fail("Änderung konnte nicht gespeichert werden.", cause);
      }
    },
    async deletePerson(id: string) {
      const person = state.personen.find((item) => item.id === id);
      if (!person) return;
      try {
        await adapter.deletePerson(person);
        replace({ ...state, personen: state.personen.filter((item) => item.id !== id) });
      } catch (cause) {
        fail("Kontakt ist noch referenziert und kann nicht gelöscht werden.", cause);
      }
    },
    async deleteKunde(id: string) {
      const kunde = state.kunden.find((item) => item.id === id);
      if (!kunde) return;
      try {
        await adapter.deleteKunde(kunde);
        replace({ ...state, kunden: state.kunden.filter((item) => item.id !== id) });
      } catch (cause) {
        fail("Kunde ist noch referenziert und kann nicht gelöscht werden.", cause);
      }
    },
    link(personId: string, kundeId: string) {
      return mutate(() => adapter.link(personId, kundeId));
    },
    unlink(personId: string, kundeId: string) {
      return mutate(() => adapter.unlink(personId, kundeId));
    },
    kundenVonPerson(person: Person) {
      return state.kunden.filter((kunde) => person.kundenIds.includes(kunde.id));
    },
    kontakteVonKunde(id: string) {
      return state.personen.filter((person) => person.kundenIds.includes(id));
    },
    findDuplicate(vorname: string, nachname: string, email: string) {
      return findDuplicate(vorname, nachname, email);
    },
  };
}
