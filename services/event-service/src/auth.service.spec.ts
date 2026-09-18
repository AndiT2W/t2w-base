import { describe, expect, it, vi } from "vitest";
import { AuthService } from "./auth.service.js";

describe("AuthService", () => {
  it("hashes and verifies passwords without storing the clear text", async () => {
    const auth = new AuthService({} as never);
    const encoded = await auth.hashPassword("correct horse battery staple");
    expect(encoded).not.toContain("correct horse");
    await expect(auth.verifyPassword("correct horse battery staple", encoded)).resolves.toBe(true);
    await expect(auth.verifyPassword("wrong", encoded)).resolves.toBe(false);
  });

  it("locks the fifth failed login for 15 minutes and honors remember-me after expiry", async () => {
    const password = "Strong-login-123";
    const bootstrap = new AuthService({} as never);
    const user = {
      id: "user-1",
      email: "user@example.test",
      displayName: "Test User",
      firstName: "Test",
      lastName: "User",
      pendingEmail: null,
      role: "USER",
      status: "ACTIVE",
      financeAccess: false,
      organizerId: null,
      passwordHash: await bootstrap.hashPassword(password),
      failedLoginAttempts: 4,
      lockedUntil: null as Date | null,
      lastLoginAt: null as Date | null,
    };
    const prisma = {
      user: {
        findUnique: vi.fn(async () => user),
        update: vi.fn(async ({ data }: { data: Partial<typeof user> }) => {
          Object.assign(user, data);
          return { ...user, organizer: null };
        }),
      },
      session: { create: vi.fn() },
      auditLog: { create: vi.fn() },
    };
    const auth = new AuthService(prisma as never);

    await expect(auth.login(user.email, "wrong")).rejects.toThrow("Ungültige Zugangsdaten");
    expect(user.failedLoginAttempts).toBe(5);
    expect(user.lockedUntil!.getTime()).toBeGreaterThan(Date.now() + 14 * 60 * 1000);
    expect(prisma.auditLog.create).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "login-locked" }) }),
    );
    await expect(auth.login(user.email, password)).rejects.toThrow("Konto vorübergehend gesperrt");

    user.lockedUntil = new Date(Date.now() - 1);
    const result = await auth.login(user.email, password, true);
    expect(result.maxAgeMs).toBe(30 * 24 * 60 * 60 * 1000);
    expect(prisma.session.create).toHaveBeenCalledOnce();
    expect(user.failedLoginAttempts).toBe(0);
    expect(user.lockedUntil).toBeNull();
  });

  it("rejects expired sessions and sessions of disabled users", async () => {
    const session = {
      expiresAt: new Date(Date.now() - 1),
      user: { status: "ACTIVE" },
    };
    const prisma = { session: { findUnique: vi.fn(async () => session) } };
    const auth = new AuthService(prisma as never);

    await expect(auth.userForToken("expired")).rejects.toThrow();
    session.expiresAt = new Date(Date.now() + 60_000);
    session.user.status = "DISABLED";
    await expect(auth.userForToken("disabled")).rejects.toThrow();
  });
});
