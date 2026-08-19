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

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !user.active || !(await this.verifyPassword(password, user.passwordHash))) throw new UnauthorizedException("Ungültige Zugangsdaten");
    const rawToken = randomBytes(32).toString("base64url");
    await this.prisma.session.create({ data: { tokenHash: this.tokenHash(rawToken), userId: user.id, expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000) } });
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return { rawToken, user: { id: user.id, displayName: user.displayName, email: user.email, role: user.role } };
  }

  async userForToken(token?: string) {
    if (!token) throw new UnauthorizedException();
    const session = await this.prisma.session.findUnique({ where: { tokenHash: this.tokenHash(token) }, include: { user: true } });
    if (!session || session.expiresAt < new Date() || !session.user.active) throw new UnauthorizedException();
    return session.user;
  }

  async logout(token?: string) { if (token) await this.prisma.session.deleteMany({ where: { tokenHash: this.tokenHash(token) } }); }
  private tokenHash(token: string) { return createHash("sha256").update(token).digest("hex"); }
}
