import type { Kunde, Person } from "@/lib/crm/types";
import type { EventEditingSession, OutlookFolderPlan, SaveResult, SyncResult } from "./event-workspace";
import type { T2WEvent } from "./types";

type DraftInputKey = "contactSearch" | "invoiceRecipientSearch" | "newTask" | "newFile" | "newActivity";
type DraftInputs = Record<DraftInputKey, string> & { contactId: string; contactRole: string };

export type EventDetailSnapshot = DraftInputs & {
  form: T2WEvent;
  outlookPlan: OutlookFolderPlan | null;
  outlookSyncing: boolean;
  outlookSyncMessage: string | null;
  time2winSyncing: boolean;
  time2winSyncMessage: string | null;
  visibleContacts: Person[];
  organizerContacts: Person[];
  payoutRecipientId?: string | null;
  payoutRecipient?: Kunde;
  invoiceRecipientIds: string[];
  invoiceRecipients: Kunde[];
  visibleInvoiceRecipients: Kunde[];
};

export function createEventDetailWorkspace(
  session: EventEditingSession,
  initial: { event: T2WEvent; persons: Person[]; customers: Kunde[] },
) {
  let event = initial.event;
  let persons = initial.persons;
  let customers = initial.customers;
  let outlookPlan: OutlookFolderPlan | null = null;
  let outlookSyncing = false;
  let outlookSyncMessage: string | null = null;
  let time2winSyncing = false;
  let time2winSyncMessage: string | null = null;
  let inputs: DraftInputs = {
    contactId: "",
    contactRole: "Kontakt",
    contactSearch: "",
    invoiceRecipientSearch: "",
    newTask: "",
    newFile: "",
    newActivity: "",
  };
  const subscribers = new Set<() => void>();
  let snapshot: EventDetailSnapshot;

  const buildSnapshot = (): EventDetailSnapshot => {
    const form = session.snapshot();
    const contactQuery = inputs.contactSearch.trim().toLocaleLowerCase("de");
    const invoiceQuery = inputs.invoiceRecipientSearch.trim().toLocaleLowerCase("de");
    const invoiceRecipientIds =
      form.rechnungsempfaengerIds ?? (event.veranstalterId ? [event.veranstalterId] : []);
    const payoutRecipientId = form.auszahlungsempfaengerId ?? event.veranstalterId;
    return {
      ...inputs,
      form,
      outlookPlan,
      outlookSyncing,
      outlookSyncMessage,
      time2winSyncing,
      time2winSyncMessage,
      organizerContacts: event.veranstalterId
        ? persons.filter((person) => person.kundenIds.includes(event.veranstalterId!))
        : [],
      visibleContacts: persons.filter((person) =>
        !form.kontakte.some((contact) => contact.id === person.id) &&
        (!contactQuery || `${person.vorname} ${person.nachname} ${person.email}`.toLocaleLowerCase("de").includes(contactQuery)),
      ),
      payoutRecipientId,
      payoutRecipient: customers.find((customer) => customer.id === payoutRecipientId),
      invoiceRecipientIds,
      invoiceRecipients: customers.filter((customer) => invoiceRecipientIds.includes(customer.id)),
      visibleInvoiceRecipients: customers.filter((customer) =>
        customer.name.toLocaleLowerCase("de").includes(invoiceQuery),
      ),
    };
  };
  const publish = () => {
    snapshot = buildSnapshot();
    subscribers.forEach((subscriber) => subscriber());
  };
  snapshot = buildSnapshot();
  session.subscribe(publish);
  const requireSaved = async (result: Promise<SaveResult>, code: string) => {
    const resolved = await result;
    if (resolved.kind !== "saved") throw new Error(code);
    return resolved;
  };

  return {
    snapshot: () => snapshot,
    subscribe(subscriber: () => void) { subscribers.add(subscriber); return () => subscribers.delete(subscriber); },
    accept(eventSnapshot: T2WEvent, nextPersons: Person[], nextCustomers: Kunde[]) {
      event = eventSnapshot;
      persons = nextPersons;
      customers = nextCustomers;
      session.accept(eventSnapshot);
      publish();
    },
    update<K extends keyof T2WEvent>(key: K, value: T2WEvent[K]) { session.update({ [key]: value }); },
    setInput<K extends keyof DraftInputs>(key: K, value: DraftInputs[K]) {
      inputs = { ...inputs, [key]: value };
      publish();
    },
    selectContact(id: string) {
      inputs = { ...inputs, contactId: id, contactSearch: "" };
      publish();
    },
    toggleInvoiceRecipient(id: string) {
      const ids = snapshot.invoiceRecipientIds.includes(id)
        ? snapshot.invoiceRecipientIds.filter((recipientId) => recipientId !== id)
        : [...snapshot.invoiceRecipientIds, id];
      session.update({ rechnungsempfaengerIds: ids });
    },
    async refreshOutlookPlan() {
      try { outlookPlan = await session.outlookPlan(); }
      catch { outlookPlan = null; }
      publish();
      return outlookPlan;
    },
    async save(reloadCrm?: () => Promise<void>) {
      const result = await session.save();
      if (result.kind === "saved") await reloadCrm?.();
      return result;
    },
    async syncOutlook(): Promise<SyncResult> {
      outlookSyncing = true;
      outlookSyncMessage = null;
      publish();
      const result = await session.syncOutlook();
      if (result.kind === "synced") {
        try { outlookPlan = await session.outlookPlan(); }
        catch { outlookPlan = null; }
      }
      outlookSyncing = false;
      outlookSyncMessage = result.kind === "synced"
        ? "Outlook-Ordner synchronisiert."
        : "Outlook-Ordner konnte nicht synchronisiert werden.";
      publish();
      return result;
    },
    async syncTime2win() {
      time2winSyncing = true;
      time2winSyncMessage = null;
      publish();
      try {
        const result = await session.syncTime2win();
        if (result.kind !== "synced") throw result.error;
        event = result.event;
        time2winSyncMessage = "TIME2WIN-Teilnehmer synchronisiert.";
        return result;
      } catch {
        time2winSyncMessage = "TIME2WIN-Synchronisierung fehlgeschlagen. Der letzte erfolgreiche Wert bleibt erhalten.";
        return { kind: "failed" as const };
      } finally {
        time2winSyncing = false;
        publish();
      }
    },
    addEventContact(personId: string, role: string) {
      if (!persons.some((person) => person.id === personId)) return Promise.reject(new Error("PERSON_NOT_FOUND"));
      return requireSaved(session.addContact(personId, role), "EVENT_CONTACT_SAVE_FAILED");
    },
    async addSelectedContact() {
      if (!inputs.contactId) return undefined;
      const result = await this.addEventContact(inputs.contactId, inputs.contactRole);
      inputs = { ...inputs, contactId: "" };
      publish();
      return result;
    },
    updateContactRole(contact: T2WEvent["kontakte"][number], role: string) {
      const nextRole = role.trim() || "Kontakt";
      if (nextRole === contact.rolle) return Promise.resolve(undefined);
      return requireSaved(
        session.updateContactRole(contact.id, contact.rolle, nextRole),
        "EVENT_CONTACT_SAVE_FAILED",
      );
    },
    removeContact(contactId: string, role: string) {
      return requireSaved(session.removeContact(contactId, role), "EVENT_CONTACT_REMOVE_FAILED");
    },
    async addTask() {
      if (!inputs.newTask.trim()) return undefined;
      const result = await requireSaved(session.createTask({ title: inputs.newTask }), "EVENT_TASK_SAVE_FAILED");
      inputs = { ...inputs, newTask: "" };
      publish();
      return result;
    },
    updateTask(taskId: string, completed: boolean) {
      return requireSaved(session.updateTask(taskId, { completed }), "EVENT_TASK_SAVE_FAILED");
    },
    async addFile() {
      if (!inputs.newFile.trim()) return undefined;
      const result = await requireSaved(session.createFile({ name: inputs.newFile }), "EVENT_FILE_SAVE_FAILED");
      inputs = { ...inputs, newFile: "" };
      publish();
      return result;
    },
    async addActivity() {
      if (!inputs.newActivity.trim()) return undefined;
      const result = await requireSaved(
        session.createActivity({ channel: "Notiz", subject: inputs.newActivity }),
        "EVENT_ACTIVITY_SAVE_FAILED",
      );
      inputs = { ...inputs, newActivity: "" };
      publish();
      return result;
    },
    async confirmOutlookMove(path: string) {
      session.update({ outlookOrdner: path });
      return session.save();
    },
  };
}

export type EventDetailWorkspace = ReturnType<typeof createEventDetailWorkspace>;
