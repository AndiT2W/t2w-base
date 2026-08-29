import { describe, expect, it, vi } from "vitest";
import { createCrmLifecycle } from "./lifecycle";

describe("CRM lifecycle module", () => {
  it("owns person-customer input shaping behind its interface", async () => {
    const createKunde = vi.fn().mockResolvedValue(undefined);
    const workspace = {
      snapshot: () => ({ personen: [{ id: "p1", vorname: "Ada", nachname: "Lovelace" }] }),
      createKunde,
    } as never;
    const lifecycle = createCrmLifecycle(workspace);
    await lifecycle.createCustomerForPerson("p1", { status: "aktiv" } as never);
    expect(createKunde).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Ada Lovelace", personId: "p1", typ: "person" }),
    );
  });
});
