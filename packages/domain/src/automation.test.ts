import { describe, expect, it } from "vitest";
import { applyAutomationResult, idempotencyKey } from "./automation.js";
describe("automation contract",()=>{it("uses stable idempotency keys",()=>expect(idempotencyKey("payout","p1","wf-1")).toBe("payout:p1:wf-1"));it("keeps failures retryable and increments retry count",()=>expect(applyAutomationResult({status:"CLAIMED",retryCount:1},{success:false,error:"timeout"},"2026-01-01")).toMatchObject({status:"RETRYABLE",retryCount:2,lastError:"timeout"}));});
