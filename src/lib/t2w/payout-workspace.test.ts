import { describe, expect, it, vi } from "vitest";
import { createPayoutWorkspace } from "./payout-workspace";
describe("Payout workspace", () => { it("reloads the same scope after a mutation", async () => { const list = vi.fn().mockResolvedValue([]); const workspace = createPayoutWorkspace({ list, create: vi.fn().mockResolvedValue({}), update: vi.fn(), remove: vi.fn(), markForMail: vi.fn() }); await workspace.create({ eventId: "e1", status: "OFFEN" }, { amount: "10" }); expect(list).toHaveBeenCalledWith({ eventId: "e1", status: "OFFEN" }); }); });
