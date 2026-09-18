import { Injectable, UnauthorizedException } from "@nestjs/common";
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { PrismaService } from "./prisma.service.js";

const scrypt = promisify(scryptCallback);

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const derived = (await scrypt(password, salt, 64)) as Buffer;
    return `${salt}:${derived.toString("hex")}`;
  }

  async verifyPassword(password: string, encoded: string) {
    const [salt, expected] = encoded.split(":");
    if (!salt || !expected) return false;
    const actual = (await scrypt(password, salt, 64)) as Buffer;
    const target = Buffer.from(expected, "hex");
    return target.length === actual.length && timingSafeEqual(target, actual);
  }

  async login(email: string, password: string, rememberMe = false) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    const now = new Date();
    if (user?.lockedUntil && user.lockedUntil > now)
      throw new UnauthorizedException("Konto vorübergehend gesperrt.");
    const valid = Boolean(
      user?.status === "ACTIVE" &&
      user.passwordHash &&
      (await this.verifyPassword(password, user.passwordHash)),
    );
    if (!valid) {
      if (user?.status === "ACTIVE") {
        const failedLoginAttempts = user.failedLoginAttempts + 1;
        const lockedUntil = failedLoginAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
        await this.prisma.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts, lockedUntil },
        });
        await this.prisma.auditLog.create({
          data: {
            entity: "User",
            entityId: user.id,
            action: lockedUntil ? "login-locked" : "login-failed",
            userId: user.id,
            details: { failedLoginAttempts, lockedUntil },
          },
        });
      }
      throw new UnauthorizedException("Ungültige Zugangsdaten");
    }
    const rawToken = randomBytes(32).toString("base64url");
    const maxAgeMs = (rememberMe ? 30 * 24 : 8) * 60 * 60 * 1000;
    await this.prisma.session.create({
      data: {
        tokenHash: this.hashToken(rawToken),
        userId: user!.id,
        expiresAt: new Date(Date.now() + maxAgeMs),
      },
    });
    const saved = await this.prisma.user.update({
      where: { id: user!.id },
      data: { lastLoginAt: now, failedLoginAttempts: 0, lockedUntil: null },
      include: { organizer: { select: { id: true, name: true } } },
    });
    await this.prisma.auditLog.create({
      data: { entity: "User", entityId: saved.id, action: "login", userId: saved.id },
    });
    return {
      rawToken,
      maxAgeMs,
      user: this.userDto(saved),
    };
  }

  async userForToken(token?: string) {
    if (!token) throw new UnauthorizedException();
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: this.hashToken(token) },
      include: { user: true },
    });
    if (!session || session.expiresAt < new Date() || session.user.status !== "ACTIVE")
      throw new UnauthorizedException();
    return session.user;
  }

  async logout(token?: string) {
    if (token)
      await this.prisma.session.deleteMany({ where: { tokenHash: this.hashToken(token) } });
  }
  revokeSessions(userId: string) {
    return this.prisma.session.deleteMany({ where: { userId } });
  }
  hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }
  userDto(user: {
    id: string;
    displayName: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    pendingEmail?: string | null;
    role: string;
    status: string;
    financeAccess: boolean;
    organizerId?: string | null;
    organizer?: { id: string; name: string } | null;
    lastLoginAt?: Date | null;
    lockedUntil?: Date | null;
  }) {
    return {
      id: user.id,
      displayName: user.displayName,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      email: user.email,
      pendingEmail: user.pendingEmail ?? null,
      role: user.role,
      status: user.status,
      financeAccess: user.role === "ADMIN" ? true : user.financeAccess,
      organizerId: user.organizerId ?? null,
      organizer: user.organizer ?? null,
      lastLoginAt: user.lastLoginAt ?? null,
      lockedUntil: user.lockedUntil ?? null,
    };
  }
}
