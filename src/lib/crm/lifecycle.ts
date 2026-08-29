import { personName, type Kunde, type Person } from "./types";
import type { createCrmWorkspace } from "./workspace";

type Workspace = ReturnType<typeof createCrmWorkspace>;
type NewPerson = Omit<Person, "id" | "kundenprofilId" | "eventRollen">;
type NewCustomer = Omit<Kunde, "id" | "kontaktIds" | "events" | "personId"> & {
  personId?: string | null;
};
type PersonCustomer = Omit<Kunde, "id" | "name" | "personId" | "kontaktIds" | "events" | "typ">;

/** Intent-level CRM lifecycle module. React compatibility names can delegate here. */
export function createCrmLifecycle(workspace: Workspace) {
  const customerInput = (
    input: NewCustomer | PersonCustomer,
    personId: string | null,
    name: string,
    typ: Kunde["typ"],
  ) => ({
    ...input,
    name,
    personId,
    typ,
    kontaktIds: [],
    events: [],
  });
  return {
    reload: () => workspace.load(),
    createPerson: (input: NewPerson) => workspace.createPerson(input),
    createCustomer: (input: NewCustomer) =>
      workspace.createKunde(customerInput(input, input.personId ?? null, input.name, input.typ)),
    createCustomerForPerson: async (personId: string, input: PersonCustomer) => {
      const person = workspace.snapshot().personen.find((item) => item.id === personId);
      if (!person) throw new Error("PERSON_NOT_FOUND");
      await workspace.createKunde(customerInput(input, personId, personName(person), "person"));
    },
    createPersonAndCustomer: (person: NewPerson, customer: PersonCustomer) =>
      workspace.createPersonAndKunde(person, customerInput(customer, null, "", "person")),
    updatePerson: workspace.updatePerson,
    updateCustomer: workspace.updateKunde,
    deletePerson: workspace.deletePerson,
    deleteCustomer: workspace.deleteKunde,
    link: workspace.link,
    unlink: workspace.unlink,
    customersForPerson: workspace.kundenVonPerson,
    contactsForCustomer: workspace.kontakteVonKunde,
    findDuplicate: workspace.findDuplicate,
  };
}
