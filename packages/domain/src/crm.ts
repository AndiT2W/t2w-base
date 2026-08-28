export type EventRolle = "anmeldung" | "finanzen" | "timing";
export type KontaktSyncStatus = "never" | "syncing" | "success" | "error";
export const EVENTROLLE_LABEL: Record<EventRolle, string> = {
  anmeldung: "Anmeldung",
  finanzen: "Finanzen",
  timing: "Timing",
};
export type KundenStatus = "aktiv" | "inaktiv";
export const KUNDENSTATUS_LABEL: Record<KundenStatus, string> = {
  aktiv: "Aktiv",
  inaktiv: "Inaktiv",
};
export type Person = {
  id: string;
  vorname: string;
  nachname: string;
  email: string;
  telefonPrivat: string;
  telefonBeruflich: string;
  funktion: string;
  ort: string;
  land: string;
  strasse: string;
  plz: string;
  notiz: string;
  syncQuelle?: string;
  externeId?: string;
  syncStatus?: KontaktSyncStatus;
  zuletztSynchronisiertAm?: string | null;
  externeUrl?: string;
  kundenprofilId: string | null;
  kundenIds: string[];
  eventRollen: { eventcode: string; eventName: string; rolle: EventRolle }[];
};
export type Kunde = {
  id: string;
  typ: "firma" | "person";
  name: string;
  personId: string | null;
  primaryContactId?: string | null;
  uid: string;
  iban: string;
  bic: string;
  bank: string;
  land: string;
  ort: string;
  strasse: string;
  plz: string;
  email: string;
  status: KundenStatus;
  kontaktIds: string[];
  events: {
    eventcode: string;
    eventName: string;
    funktion: "veranstalter" | "auszahlung" | "rechnung";
  }[];
};
export const personName = (person: Person) => `${person.vorname} ${person.nachname}`.trim();

export type CrmState = { personen: Person[]; kunden: Kunde[] };
export type PersonInput = Omit<Person, "id" | "kundenprofilId" | "eventRollen">;
export type KundeInput = Omit<Kunde, "id" | "kontaktIds" | "events">;

export interface CrmAdapter {
  load(): Promise<CrmState>;
  link(personId: string, kundeId: string): Promise<void>;
  unlink(personId: string, kundeId: string): Promise<void>;
  createPerson(input: PersonInput): Promise<Person>;
  createKunde(input: KundeInput): Promise<Kunde>;
  updatePerson(person: Person, patch: Partial<Person>): Promise<Person>;
  updateKunde(kunde: Kunde, patch: Partial<Kunde>): Promise<Kunde>;
  deletePerson(person: Person): Promise<void>;
  deleteKunde(kunde: Kunde): Promise<void>;
}

export type CrmExpectedError = "PERSON_REFERENCED" | "ORGANIZER_REFERENCED" | "NOT_FOUND";
export type CrmCommandResult<T = void> =
  { kind: "saved"; value: T } | { kind: "rejected"; reason: CrmExpectedError };

export type ReferenceSnapshot = {
  events: number;
  payoutEvents: number;
  invoiceRecipients: number;
  contacts: number;
  person: boolean;
  primaryContact: boolean;
  eventRoles: number;
  customerProfile: boolean;
};

export interface CrmCommandAdapter<
  TCustomerProfileInput,
  TCustomerProfile,
  TOrganizerInput = unknown,
  TOrganizer = unknown,
  TContactInput = unknown,
  TContact = unknown,
> {
  organizers(): Promise<TOrganizer[]>;
  createOrganizer(input: TOrganizerInput): Promise<TOrganizer>;
  updateOrganizer(id: string, input: Partial<TOrganizerInput>): Promise<TOrganizer | null>;
  deactivateOrganizer(id: string): Promise<TOrganizer | null>;
  contacts(): Promise<TContact[]>;
  createContact(input: TContactInput): Promise<TContact>;
  updateContact(id: string, input: Partial<TContactInput>): Promise<TContact | null>;
  organizerReferences(id: string): Promise<ReferenceSnapshot | null>;
  contactReferences(id: string): Promise<ReferenceSnapshot | null>;
  deleteOrganizer(id: string): Promise<void>;
  deleteContact(id: string): Promise<void>;
  linkContact(organizerId: string, contactId: string): Promise<void>;
  unlinkContact(organizerId: string, contactId: string): Promise<void>;
  upsertCustomerProfile(contactId: string, input: TCustomerProfileInput): Promise<TCustomerProfile>;
}

export class CrmCommands<
  TCustomerProfileInput,
  TCustomerProfile,
  TOrganizerInput = unknown,
  TOrganizer = unknown,
  TContactInput = unknown,
  TContact = unknown,
> {
  constructor(
    private readonly adapter: CrmCommandAdapter<
      TCustomerProfileInput,
      TCustomerProfile,
      TOrganizerInput,
      TOrganizer,
      TContactInput,
      TContact
    >,
  ) {}

  organizers() {
    return this.adapter.organizers();
  }
  contacts() {
    return this.adapter.contacts();
  }
  async createOrganizer(input: TOrganizerInput): Promise<CrmCommandResult<TOrganizer>> {
    return { kind: "saved", value: await this.adapter.createOrganizer(input) };
  }
  async updateOrganizer(
    id: string,
    input: Partial<TOrganizerInput>,
  ): Promise<CrmCommandResult<TOrganizer>> {
    const value = await this.adapter.updateOrganizer(id, input);
    return value ? { kind: "saved", value } : { kind: "rejected", reason: "NOT_FOUND" };
  }
  async deactivateOrganizer(id: string): Promise<CrmCommandResult<TOrganizer>> {
    const value = await this.adapter.deactivateOrganizer(id);
    return value ? { kind: "saved", value } : { kind: "rejected", reason: "NOT_FOUND" };
  }
  async createContact(input: TContactInput): Promise<CrmCommandResult<TContact>> {
    return { kind: "saved", value: await this.adapter.createContact(input) };
  }
  async updateContact(
    id: string,
    input: Partial<TContactInput>,
  ): Promise<CrmCommandResult<TContact>> {
    const value = await this.adapter.updateContact(id, input);
    return value ? { kind: "saved", value } : { kind: "rejected", reason: "NOT_FOUND" };
  }

  async deleteOrganizer(id: string): Promise<CrmCommandResult> {
    const references = await this.adapter.organizerReferences(id);
    if (!references) return { kind: "rejected", reason: "NOT_FOUND" };
    if (
      references.events ||
      references.payoutEvents ||
      references.invoiceRecipients ||
      references.contacts ||
      references.person ||
      references.primaryContact
    )
      return { kind: "rejected", reason: "ORGANIZER_REFERENCED" };
    await this.adapter.deleteOrganizer(id);
    return { kind: "saved", value: undefined };
  }

  async deleteContact(id: string): Promise<CrmCommandResult> {
    const references = await this.adapter.contactReferences(id);
    if (!references) return { kind: "rejected", reason: "NOT_FOUND" };
    if (
      references.contacts ||
      references.eventRoles ||
      references.customerProfile ||
      references.primaryContact
    )
      return { kind: "rejected", reason: "PERSON_REFERENCED" };
    await this.adapter.deleteContact(id);
    return { kind: "saved", value: undefined };
  }

  async linkContact(organizerId: string, contactId: string): Promise<CrmCommandResult> {
    await this.adapter.linkContact(organizerId, contactId);
    return { kind: "saved", value: undefined };
  }

  async unlinkContact(organizerId: string, contactId: string): Promise<CrmCommandResult> {
    await this.adapter.unlinkContact(organizerId, contactId);
    return { kind: "saved", value: undefined };
  }

  async upsertCustomerProfile(
    contactId: string,
    input: TCustomerProfileInput,
  ): Promise<CrmCommandResult<TCustomerProfile>> {
    return { kind: "saved", value: await this.adapter.upsertCustomerProfile(contactId, input) };
  }
}

export function createCrmWorkspace(adapter: CrmAdapter) {
  let state: CrmState = { personen: [], kunden: [] };
  let ready = false;
  let error: string | null = null;
  let snapshot: CrmState & { bereit: boolean; fehler: string | null } = {
    ...state,
    bereit: ready,
    fehler: error,
  };
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
  const persist = async <T>(operation: () => Promise<T>, message = "Änderung konnte nicht gespeichert werden.") => {
    error = null;
    try {
      const value = await operation();
      replace(await adapter.load());
      return value;
    } catch (cause) {
      return fail(message, cause);
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
      return () => subscribers.delete(subscriber);
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
      return persist(() => adapter.createPerson(input));
    },
    async createKunde(input: KundeInput) {
      return persist(() => adapter.createKunde(input));
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
      await persist(() => adapter.updatePerson(person, patch));
    },
    async updateKunde(id: string, patch: Partial<Kunde>) {
      const kunde = state.kunden.find((item) => item.id === id);
      if (!kunde) return;
      await persist(() => adapter.updateKunde(kunde, patch));
    },
    async deletePerson(id: string) {
      const person = state.personen.find((item) => item.id === id);
      if (!person) return;
      await persist(() => adapter.deletePerson(person), "Kontakt ist noch referenziert und kann nicht gelöscht werden.");
    },
    async deleteKunde(id: string) {
      const kunde = state.kunden.find((item) => item.id === id);
      if (!kunde) return;
      await persist(() => adapter.deleteKunde(kunde), "Kunde ist noch referenziert und kann nicht gelöscht werden.");
    },
    link(personId: string, kundeId: string) {
      return persist(() => adapter.link(personId, kundeId));
    },
    unlink(personId: string, kundeId: string) {
      return persist(() => adapter.unlink(personId, kundeId));
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
