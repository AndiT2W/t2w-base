import { describe, expect, it } from "vitest";
import { AuthService } from "./auth.service.js";

describe("AuthService", () => {
  it("hashes and verifies passwords without storing the clear text", async () => {
    const auth = new AuthService({} as never);
    const encoded = await auth.hashPassword("correct horse battery staple");
    expect(encoded).not.toContain("correct horse");
    await expect(auth.verifyPassword("correct horse battery staple", encoded)).resolves.toBe(true);
    await expect(auth.verifyPassword("wrong", encoded)).resolves.toBe(false);
  });
});
