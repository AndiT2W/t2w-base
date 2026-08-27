import { describe, expect, it, vi } from "vitest";
import { CrmCommands, type CrmCommandAdapter, type ReferenceSnapshot } from "./crm.js";

const empty: ReferenceSnapshot = {
  events: 0,
  payoutEvents: 0,
  invoiceRecipients: 0,
  contacts: 0,
  person: false,
  primaryContact: false,
  eventRoles: 0,
  customerProfile: false,
};

function adapter(overrides: Partial<CrmCommandAdapter<object, object>> = {}) {
  return {
    organizerReferences: vi.fn().mockResolvedValue(empty),
    contactReferences: vi.fn().mockResolvedValue(empty),
    deleteOrganizer: vi.fn(),
    deleteContact: vi.fn(),
    linkContact: vi.fn(),
    unlinkContact: vi.fn(),
    upsertCustomerProfile: vi.fn().mockResolvedValue({}),
    ...overrides,
  } satisfies CrmCommandAdapter<object, object>;
}

describe("CRM commands", () => {
  it("preserves an organizer that is referenced by an Event", async () => {
    const persistence = adapter({
      organizerReferences: vi.fn().mockResolvedValue({ ...empty, events: 1 }),
    });
    await expect(new CrmCommands(persistence).deleteOrganizer("customer-1")).resolves.toEqual({
      kind: "rejected",
      reason: "ORGANIZER_REFERENCED",
    });
    expect(persistence.deleteOrganizer).not.toHaveBeenCalled();
  });

  it("preserves a person and Event roles when unlinking a customer association", async () => {
    const persistence = adapter();
    await expect(new CrmCommands(persistence).unlinkContact("customer-1", "person-1")).resolves.toEqual({
      kind: "saved",
      value: undefined,
    });
    expect(persistence.unlinkContact).toHaveBeenCalledWith("customer-1", "person-1");
    expect(persistence.deleteContact).not.toHaveBeenCalled();
  });
});
