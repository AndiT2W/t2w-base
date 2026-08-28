import {
  personName,
  type CrmAdapter,
  type CrmState,
  type Kunde,
  type KundeInput,
  type Person,
  type PersonInput,
} from "@t2w/domain/crm";

type Request = typeof fetch;
export type CrmModule = CrmAdapter;
export type { CrmState, KundeInput, PersonInput } from "@t2w/domain/crm";

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
  syncSource?: string | null;
  externalId?: string | null;
  syncStatus?: string | null;
  lastSyncedAt?: string | null;
  externalUrl?: string | null;
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
  primaryContactId?: string | null;
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
  events?: { eventCode: string; name: string }[];
  payoutEvents?: { eventCode: string; name: string }[];
  invoiceRecipients?: { event: { eventCode: string; name: string } }[];
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
    syncQuelle: value.syncSource ?? "",
    externeId: value.externalId ?? "",
    syncStatus: value.syncStatus?.toLowerCase() as Person["syncStatus"],
    zuletztSynchronisiertAm: value.lastSyncedAt ?? null,
    externeUrl: value.externalUrl ?? "",
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
    primaryContactId: value.primaryContactId ?? null,
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
    events: [
      ...(value.events ?? []).map((event) => ({ ...event, funktion: "veranstalter" as const })),
      ...(value.payoutEvents ?? []).map((event) => ({ ...event, funktion: "auszahlung" as const })),
      ...(value.invoiceRecipients ?? []).map(({ event }) => ({
        ...event,
        funktion: "rechnung" as const,
      })),
    ].map(({ eventCode, name, funktion }) => ({ eventcode: eventCode, eventName: name, funktion })),
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
    async link(personId: string, kundeId: string): Promise<CrmState> {
      await json(request, `/api/v1/organizers/${kundeId}/contacts/${personId}`, { method: "PUT" });
      return this.load();
    },
    async unlink(personId: string, kundeId: string): Promise<CrmState> {
      await json(request, `/api/v1/organizers/${kundeId}/contacts/${personId}`, {
        method: "DELETE",
      });
      return this.load();
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
            syncSource: input.syncQuelle,
            externalId: input.externeId,
            syncStatus: input.syncStatus?.toUpperCase(),
            lastSyncedAt: input.zuletztSynchronisiertAm,
            externalUrl: input.externeUrl,
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
            primaryContactId: input.primaryContactId,
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
            primaryContactId: next.primaryContactId,
            privatePhone: next.telefonPrivat,
            workPhone: next.telefonBeruflich,
            country: next.land,
            city: next.ort,
            street: next.strasse,
            postalCode: next.plz,
            note: next.notiz,
            function: next.funktion,
            location: next.ort,
            syncSource: next.syncQuelle,
            externalId: next.externeId,
            syncStatus: next.syncStatus?.toUpperCase(),
            lastSyncedAt: next.zuletztSynchronisiertAm,
            externalUrl: next.externeUrl,
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
            primaryContactId: next.primaryContactId,
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
    async deletePerson(person: Person) {
      await json(request, `/api/v1/contacts/${person.id}`, { method: "DELETE" });
    },
    async deleteKunde(kunde: Kunde) {
      await json(request, `/api/v1/organizers/${kunde.id}`, { method: "DELETE" });
    },
  };
}

export const createCrmModule = createHttpCrmAdapter;
