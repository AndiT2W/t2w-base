import { personName, type Kunde, type Person } from "./types";

export type CrmState = { personen: Person[]; kunden: Kunde[] };
type Request = typeof fetch;
export type PersonInput = Omit<Person, "id" | "kundenprofilId" | "eventRollen">;
export type KundeInput = Omit<Kunde, "id" | "kontaktIds" | "events">;
export interface CrmModule {
  load(): Promise<CrmState>;
  link(state: CrmState, personId: string, kundeId: string): Promise<CrmState>;
  unlink(state: CrmState, personId: string, kundeId: string): Promise<CrmState>;
  createPerson(input: PersonInput): Promise<Person>;
  createKunde(input: KundeInput): Promise<Kunde>;
  updatePerson(person: Person, patch: Partial<Person>): Promise<Person>;
  updateKunde(kunde: Kunde, patch: Partial<Kunde>): Promise<Kunde>;
}

type ApiPerson = {
  id: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  privatePhone?: string | null;
  workPhone?: string | null;
  country?: string | null;
  city?: string | null;
  street?: string | null;
  postalCode?: string | null;
  note?: string | null;
  function?: string | null;
  location?: string | null;
  organizers?: { organizer: { id: string } }[];
  customerProfile?: { id: string } | null;
  eventRoles?: { role: string; event?: { eventCode: string; name: string } }[];
};
type ApiKunde = {
  id: string;
  name: string;
  type: "ORGANISATION" | "PERSON";
  active?: boolean;
  personId?: string | null;
  uid?: string | null;
  iban?: string | null;
  bic?: string | null;
  bankName?: string | null;
  country?: string | null;
  city?: string | null;
  street?: string | null;
  postalCode?: string | null;
  email?: string | null;
  contacts?: { contact: { id: string } }[];
};

async function json<T>(request: Request, url: string, init?: RequestInit): Promise<T> {
  const response = await request(url, { credentials: "include", ...init });
  if (!response.ok) throw new Error(`CRM_REQUEST_FAILED:${response.status}`);
  return response.status === 204 ? (undefined as T) : (response.json() as Promise<T>);
}

function mapPerson(value: ApiPerson): Person {
  const split = value.name.trim().split(/\s+/);
  return {
    id: value.id,
    vorname: value.firstName ?? split.slice(0, -1).join(" "),
    nachname: value.lastName ?? split.at(-1) ?? "",
    email: value.email ?? "",
    telefonPrivat: value.privatePhone ?? value.phone ?? "",
    telefonBeruflich: value.workPhone ?? "",
    funktion: value.function ?? "",
    ort: value.city ?? value.location ?? "",
    land: value.country ?? "",
    strasse: value.street ?? "",
    plz: value.postalCode ?? "",
    notiz: value.note ?? "",
    kundenprofilId: value.customerProfile?.id ?? null,
    kundenIds: value.organizers?.map(({ organizer }) => organizer.id) ?? [],
    eventRollen:
      value.eventRoles?.flatMap((role) =>
        role.event
          ? [
              {
                eventcode: role.event.eventCode,
                eventName: role.event.name,
                rolle: role.role as Person["eventRollen"][number]["rolle"],
              },
            ]
          : [],
      ) ?? [],
  };
}

function mapKunde(value: ApiKunde): Kunde {
  return {
    id: value.id,
    typ: value.type === "PERSON" ? "person" : "firma",
    name: value.name,
    personId: value.personId ?? null,
    uid: value.uid ?? "",
    iban: value.iban ?? "",
    bic: value.bic ?? "",
    bank: value.bankName ?? "",
    land: value.country ?? "",
    ort: value.city ?? "",
    strasse: value.street ?? "",
    plz: value.postalCode ?? "",
    email: value.email ?? "",
    status: value.active === false ? "inaktiv" : "aktiv",
    kontaktIds: value.contacts?.map(({ contact }) => contact.id) ?? [],
    events: [],
  };
}

const headers = { "Content-Type": "application/json" };

export function createHttpCrmAdapter(request: Request = fetch): CrmModule {
  return {
    async load(): Promise<CrmState> {
      const [personen, kunden] = await Promise.all([
        json<ApiPerson[]>(request, "/api/v1/contacts"),
        json<ApiKunde[]>(request, "/api/v1/organizers"),
      ]);
      return { personen: personen.map(mapPerson), kunden: kunden.map(mapKunde) };
    },
    async link(state: CrmState, personId: string, kundeId: string): Promise<CrmState> {
      await json(request, `/api/v1/organizers/${kundeId}/contacts/${personId}`, { method: "PUT" });
      return {
        personen: state.personen.map((p) =>
          p.id === personId && !p.kundenIds.includes(kundeId)
            ? { ...p, kundenIds: [...p.kundenIds, kundeId] }
            : p,
        ),
        kunden: state.kunden.map((k) =>
          k.id === kundeId && !k.kontaktIds.includes(personId)
            ? { ...k, kontaktIds: [...k.kontaktIds, personId] }
            : k,
        ),
      };
    },
    async unlink(state: CrmState, personId: string, kundeId: string): Promise<CrmState> {
      await json(request, `/api/v1/organizers/${kundeId}/contacts/${personId}`, {
        method: "DELETE",
      });
      return {
        personen: state.personen.map((p) =>
          p.id === personId ? { ...p, kundenIds: p.kundenIds.filter((id) => id !== kundeId) } : p,
        ),
        kunden: state.kunden.map((k) =>
          k.id === kundeId ? { ...k, kontaktIds: k.kontaktIds.filter((id) => id !== personId) } : k,
        ),
      };
    },
    async createPerson(input: PersonInput): Promise<Person> {
      return mapPerson(
        await json<ApiPerson>(request, "/api/v1/contacts", {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: `${input.vorname} ${input.nachname}`.trim(),
            firstName: input.vorname,
            lastName: input.nachname,
            email: input.email,
            privatePhone: input.telefonPrivat,
            workPhone: input.telefonBeruflich,
            country: input.land,
            city: input.ort,
            street: input.strasse,
            postalCode: input.plz,
            note: input.notiz,
            function: input.funktion,
            location: input.ort,
          }),
        }),
      );
    },
    async createKunde(input: KundeInput): Promise<Kunde> {
      return mapKunde(
        await json<ApiKunde>(request, "/api/v1/organizers", {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: input.name,
            personId: input.personId,
            country: input.land,
            city: input.ort,
            street: input.strasse,
            postalCode: input.plz,
            uid: input.uid,
            iban: input.iban,
            bic: input.bic,
            bankName: input.bank,
            email: input.email,
          }),
        }),
      );
    },
    async updatePerson(person: Person, patch: Partial<Person>): Promise<Person> {
      const next = { ...person, ...patch };
      return mapPerson(
        await json<ApiPerson>(request, `/api/v1/contacts/${person.id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            name: personName(next),
            firstName: next.vorname,
            lastName: next.nachname,
            email: next.email,
            privatePhone: next.telefonPrivat,
            workPhone: next.telefonBeruflich,
            country: next.land,
            city: next.ort,
            street: next.strasse,
            postalCode: next.plz,
            note: next.notiz,
            function: next.funktion,
            location: next.ort,
          }),
        }),
      );
    },
    async updateKunde(kunde: Kunde, patch: Partial<Kunde>): Promise<Kunde> {
      const next = { ...kunde, ...patch };
      return mapKunde(
        await json<ApiKunde>(request, `/api/v1/organizers/${kunde.id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            name: next.name,
            country: next.land,
            city: next.ort,
            street: next.strasse,
            postalCode: next.plz,
            uid: next.uid,
            iban: next.iban,
            bic: next.bic,
            bankName: next.bank,
            email: next.email,
            active: next.status !== "inaktiv",
          }),
        }),
      );
    },
  };
}

export const createCrmModule = createHttpCrmAdapter;
