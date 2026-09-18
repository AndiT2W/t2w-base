import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, type UserRole, type UserStatus } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { AuditService } from "./audit.service.js";
import { AuthService } from "./auth.service.js";
import { PrismaService } from "./prisma.service.js";
import { SecurityMailService } from "./security-mail.service.js";

type UserInput = {
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string;
  role?: UserRole;
  status?: UserStatus;
  financeAccess?: boolean;
  organizerId?: string | null;
  password?: string;
};

const normalizeEmail = (email: string) => email.trim().toLocaleLowerCase("de");
const clean = (value?: string | null) => value?.trim() || null;
const displayName = (input: UserInput, fallback = "Benutzer") =>
  clean(input.displayName) ??
  ([clean(input.firstName), clean(input.lastName)].filter(Boolean).join(" ") || fallback);

@Injectable()
export class UserManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly audit: AuditService,
    private readonly mail: SecurityMailService,
  ) {}

  async list(status?: UserStatus) {
    const users = await this.prisma.user.findMany({
      where: status ? { status } : undefined,
      include: { organizer: { select: { id: true, name: true } }, invitation: true },
      orderBy: [{ status: "asc" }, { displayName: "asc" }],
    });
    return users.map((user) => ({
      ...this.auth.userDto(user),
      invitationExpiresAt: user.invitation?.expiresAt ?? null,
    }));
  }

  async invite(input: UserInput, actorId: string) {
    const email = normalizeEmail(input.email ?? "");
    if (!this.validEmail(email))
      throw new BadRequestException("Gültige E-Mail-Adresse erforderlich.");
    const role = this.role(input.role);
    await this.validateRoleLink(role, input.organizerId ?? null);
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            email,
            firstName: clean(input.firstName),
            lastName: clean(input.lastName),
            displayName: displayName(input, email),
            role,
            status: "INVITED",
            financeAccess:
              role === "ADMIN" ? true : role === "USER" && Boolean(input.financeAccess),
            organizerId: role === "ORGANIZER" ? input.organizerId : null,
          },
        });
        await tx.userInvitation.create({
          data: { userId: created.id, tokenHash: this.auth.hashToken(token), expiresAt },
        });
        await this.audit.append(
          {
            entity: "User",
            entityId: created.id,
            action: "invite",
            userId: actorId,
            newValue: this.snapshot(created),
          },
          tx,
        );
        return created;
      });
      const activationUrl = this.url("invite", token);
      await this.mail.send({
        userId: user.id,
        recipient: user.email,
        kind: "INVITATION",
        subject: "Einladung zu GCW Base",
        body: `Ihr Konto wurde eingeladen. Der Link ist 48 Stunden gültig:\n${activationUrl}`,
      });
      return { ...this.auth.userDto(user), invitationExpiresAt: expiresAt, activationUrl };
    } catch (error) {
      this.rethrowUnique(error);
    }
  }

  async resendInvitation(userId: string, actorId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status !== "INVITED")
      throw new NotFoundException("Offene Einladung nicht gefunden.");
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    await this.prisma.$transaction(async (tx) => {
      await tx.userInvitation.upsert({
        where: { userId },
        create: { userId, tokenHash: this.auth.hashToken(token), expiresAt },
        update: { tokenHash: this.auth.hashToken(token), expiresAt, createdAt: new Date() },
      });
      await this.audit.append(
        { entity: "User", entityId: userId, action: "invite-resend", userId: actorId },
        tx,
      );
    });
    const activationUrl = this.url("invite", token);
    await this.mail.send({
      userId,
      recipient: user.email,
      kind: "INVITATION",
      subject: "Neue Einladung zu GCW Base",
      body: `Der neue Aktivierungslink ist 48 Stunden gültig:\n${activationUrl}`,
    });
    return { ok: true, invitationExpiresAt: expiresAt, activationUrl };
  }

  async revokeInvitation(userId: string, actorId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status !== "INVITED")
      throw new NotFoundException("Offene Einladung nicht gefunden.");
    await this.prisma.$transaction(async (tx) => {
      await tx.userInvitation.deleteMany({ where: { userId } });
      await tx.user.update({
        where: { id: userId },
        data: { status: "DISABLED", statusChangedAt: new Date() },
      });
      await this.audit.append(
        { entity: "User", entityId: userId, action: "invite-revoke", userId: actorId },
        tx,
      );
    });
    return { ok: true };
  }

  async activate(input: {
    token?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
  }) {
    this.validatePassword(input.password ?? "");
    const invitation = await this.prisma.userInvitation.findUnique({
      where: { tokenHash: this.auth.hashToken(input.token ?? "") },
      include: { user: true },
    });
    if (!invitation || invitation.expiresAt < new Date() || invitation.user.status !== "INVITED")
      throw new BadRequestException("Aktivierungslink ist ungültig oder abgelaufen.");
    const firstName = clean(input.firstName);
    const lastName = clean(input.lastName);
    const saved = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: invitation.userId },
        data: {
          firstName,
          lastName,
          displayName: displayName({ firstName, lastName }, invitation.user.email),
          passwordHash: await this.auth.hashPassword(input.password!),
          passwordChangedAt: new Date(),
          status: "ACTIVE",
          statusChangedAt: new Date(),
        },
      });
      await tx.userInvitation.delete({ where: { id: invitation.id } });
      await this.audit.append(
        {
          entity: "User",
          entityId: updated.id,
          action: "activate",
          userId: updated.id,
          newValue: this.snapshot(updated),
        },
        tx,
      );
      return updated;
    });
    await this.mail.send({
      userId: saved.id,
      recipient: saved.email,
      kind: "ACTIVATED",
      subject: "GCW Base-Konto aktiviert",
      body: "Ihr Konto wurde erfolgreich aktiviert.",
    });
    return { ok: true };
  }

  async update(userId: string, input: UserInput, actorId: string) {
    const current = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!current) throw new NotFoundException("Benutzer nicht gefunden.");
    const role = input.role ?? current.role;
    const status = input.status ?? current.status;
    if (actorId === userId && (role !== "ADMIN" || status !== "ACTIVE"))
      throw new ForbiddenException(
        "Das eigene Administratorkonto kann nicht herabgestuft oder deaktiviert werden.",
      );
    if (
      current.role === "ADMIN" &&
      current.status === "ACTIVE" &&
      (role !== "ADMIN" || status !== "ACTIVE")
    )
      await this.ensureAnotherAdmin(userId);
    const organizerId = role === "ORGANIZER" ? (input.organizerId ?? current.organizerId) : null;
    await this.validateRoleLink(role, organizerId);
    const requestedEmail = input.email === undefined ? current.email : normalizeEmail(input.email);
    if (!this.validEmail(requestedEmail))
      throw new BadRequestException("Gültige E-Mail-Adresse erforderlich.");
    const emailChanged = requestedEmail !== current.email;
    if (
      emailChanged &&
      (await this.prisma.user.findFirst({
        where: {
          OR: [{ email: requestedEmail }, { pendingEmail: requestedEmail }],
          NOT: { id: userId },
        },
      }))
    )
      throw new ConflictException("E-Mail-Adresse wird bereits verwendet.");
    const emailToken = emailChanged ? randomBytes(32).toString("base64url") : null;
    if (input.password !== undefined) this.validatePassword(input.password);
    const firstName = input.firstName === undefined ? current.firstName : clean(input.firstName);
    const lastName = input.lastName === undefined ? current.lastName : clean(input.lastName);
    const meaningfulSecurityChange =
      role !== current.role ||
      status !== current.status ||
      organizerId !== current.organizerId ||
      (role === "USER" && Boolean(input.financeAccess) !== current.financeAccess) ||
      input.password !== undefined ||
      emailChanged;
    try {
      const saved = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.user.update({
          where: { id: userId },
          data: {
            email: current.email,
            pendingEmail: emailChanged ? requestedEmail : current.pendingEmail,
            firstName,
            lastName,
            displayName: displayName({ ...input, firstName, lastName }, current.displayName),
            role,
            status,
            statusChangedAt: status === current.status ? current.statusChangedAt : new Date(),
            financeAccess:
              role === "ADMIN"
                ? true
                : role === "USER" && Boolean(input.financeAccess ?? current.financeAccess),
            organizerId,
            passwordHash:
              input.password === undefined
                ? current.passwordHash
                : await this.auth.hashPassword(input.password),
            passwordChangedAt:
              input.password === undefined ? current.passwordChangedAt : new Date(),
            failedLoginAttempts: status === "ACTIVE" ? current.failedLoginAttempts : 0,
            lockedUntil: status === "ACTIVE" ? current.lockedUntil : null,
          },
          include: { organizer: { select: { id: true, name: true } } },
        });
        if (emailToken) {
          await tx.emailChangeToken.updateMany({
            where: { userId, usedAt: null },
            data: { usedAt: new Date() },
          });
          await tx.emailChangeToken.create({
            data: {
              userId,
              email: requestedEmail,
              tokenHash: this.auth.hashToken(emailToken),
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
          });
        }
        if (meaningfulSecurityChange) await tx.session.deleteMany({ where: { userId } });
        await this.audit.append(
          {
            entity: "User",
            entityId: userId,
            action: "update",
            userId: actorId,
            oldValue: this.snapshot(current),
            newValue: this.snapshot(updated),
          },
          tx,
        );
        return updated;
      });
      if (meaningfulSecurityChange)
        await this.mail.send({
          userId,
          recipient: saved.email,
          kind: "ACCOUNT_CHANGED",
          subject: "GCW Base-Konto geändert",
          body: "Berechtigung, Rolle, Status oder Passwort Ihres Kontos wurde geändert.",
        });
      if (emailToken)
        await this.mail.send({
          userId,
          recipient: requestedEmail,
          kind: "EMAIL_CHANGE",
          subject: "Neue E-Mail-Adresse bestätigen",
          body: `Bestätigen Sie die neue Adresse:\n${this.url("emailChange", emailToken)}`,
        });
      return this.auth.userDto(saved);
    } catch (error) {
      this.rethrowUnique(error);
    }
  }

  async unlock(userId: string, actorId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
    await this.audit.append({
      entity: "User",
      entityId: userId,
      action: "unlock",
      userId: actorId,
    });
    return this.auth.userDto(user);
  }

  async profile(userId: string, input: { firstName?: string; lastName?: string }) {
    const current = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const firstName = input.firstName === undefined ? current.firstName : clean(input.firstName);
    const lastName = input.lastName === undefined ? current.lastName : clean(input.lastName);
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        displayName: displayName({ firstName, lastName }, current.email),
      },
    });
    return this.auth.userDto(user);
  }

  async changePassword(userId: string, currentPassword: string, password: string) {
    this.validatePassword(password);
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.passwordHash || !(await this.auth.verifyPassword(currentPassword, user.passwordHash)))
      throw new ForbiddenException("Aktuelles Passwort ist falsch.");
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          passwordHash: await this.auth.hashPassword(password),
          passwordChangedAt: new Date(),
        },
      });
      await tx.session.deleteMany({ where: { userId } });
      await this.audit.append(
        { entity: "User", entityId: userId, action: "password-change", userId },
        tx,
      );
    });
    await this.mail.send({
      userId,
      recipient: user.email,
      kind: "PASSWORD_CHANGED",
      subject: "GCW Base-Passwort geändert",
      body: "Ihr Passwort wurde geändert. Falls Sie das nicht waren, wenden Sie sich an einen Administrator.",
    });
    return { ok: true };
  }

  async requestPasswordReset(emailInput: string) {
    const email = normalizeEmail(emailInput);
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.status !== "ACTIVE") return { ok: true };
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await this.prisma.$transaction(async (tx) => {
      await tx.passwordReset.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      await tx.passwordReset.create({
        data: { userId: user.id, tokenHash: this.auth.hashToken(token), expiresAt },
      });
      await this.audit.append(
        { entity: "User", entityId: user.id, action: "password-reset-request", userId: user.id },
        tx,
      );
    });
    await this.mail.send({
      userId: user.id,
      recipient: user.email,
      kind: "PASSWORD_RESET",
      subject: "GCW Base-Passwort zurücksetzen",
      body: `Der Link ist eine Stunde gültig:\n${this.url("reset", token)}`,
    });
    return { ok: true };
  }

  async completePasswordReset(token: string, password: string) {
    this.validatePassword(password);
    const reset = await this.prisma.passwordReset.findUnique({
      where: { tokenHash: this.auth.hashToken(token) },
      include: { user: true },
    });
    if (!reset || reset.usedAt || reset.expiresAt < new Date() || reset.user.status !== "ACTIVE")
      throw new BadRequestException("Reset-Link ist ungültig oder abgelaufen.");
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: reset.userId },
        data: {
          passwordHash: await this.auth.hashPassword(password),
          passwordChangedAt: new Date(),
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
      await tx.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } });
      await tx.session.deleteMany({ where: { userId: reset.userId } });
      await this.audit.append(
        {
          entity: "User",
          entityId: reset.userId,
          action: "password-reset-complete",
          userId: reset.userId,
        },
        tx,
      );
    });
    await this.mail.send({
      userId: reset.userId,
      recipient: reset.user.email,
      kind: "PASSWORD_CHANGED",
      subject: "GCW Base-Passwort geändert",
      body: "Ihr Passwort wurde über einen Reset-Link geändert.",
    });
    return { ok: true };
  }

  async requestEmailChange(userId: string, emailInput: string) {
    const email = normalizeEmail(emailInput);
    if (!this.validEmail(email))
      throw new BadRequestException("Gültige E-Mail-Adresse erforderlich.");
    if (
      await this.prisma.user.findFirst({
        where: { OR: [{ email }, { pendingEmail: email }], NOT: { id: userId } },
      })
    )
      throw new ConflictException("E-Mail-Adresse wird bereits verwendet.");
    const token = randomBytes(32).toString("base64url");
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.user.update({ where: { id: userId }, data: { pendingEmail: email } });
        await tx.emailChangeToken.updateMany({
          where: { userId, usedAt: null },
          data: { usedAt: new Date() },
        });
        await tx.emailChangeToken.create({
          data: {
            userId,
            email,
            tokenHash: this.auth.hashToken(token),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });
        await this.audit.append(
          {
            entity: "User",
            entityId: userId,
            action: "email-change-request",
            userId,
            details: { pendingEmail: email },
          },
          tx,
        );
      });
    } catch (error) {
      this.rethrowUnique(error);
    }
    await this.mail.send({
      userId,
      recipient: email,
      kind: "EMAIL_CHANGE",
      subject: "Neue E-Mail-Adresse bestätigen",
      body: `Bestätigen Sie die neue Adresse:\n${this.url("emailChange", token)}`,
    });
    return { ok: true };
  }

  async confirmEmailChange(token: string) {
    const change = await this.prisma.emailChangeToken.findUnique({
      where: { tokenHash: this.auth.hashToken(token) },
      include: { user: true },
    });
    if (
      !change ||
      change.usedAt ||
      change.expiresAt < new Date() ||
      change.user.pendingEmail !== change.email
    )
      throw new BadRequestException("Bestätigungslink ist ungültig oder abgelaufen.");
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: change.userId },
        data: { email: change.email, pendingEmail: null },
      });
      await tx.emailChangeToken.update({ where: { id: change.id }, data: { usedAt: new Date() } });
      await tx.session.deleteMany({ where: { userId: change.userId } });
      await this.audit.append(
        {
          entity: "User",
          entityId: change.userId,
          action: "email-change-confirm",
          userId: change.userId,
          details: { oldEmail: change.user.email, newEmail: change.email },
        },
        tx,
      );
    });
    await this.mail.send({
      userId: change.userId,
      recipient: change.user.email,
      kind: "EMAIL_CHANGED",
      subject: "GCW Base-E-Mail-Adresse geändert",
      body: `Ihre Anmeldeadresse wurde zu ${change.email} geändert.`,
    });
    return { ok: true };
  }

  private role(role?: string): UserRole {
    if (!role || !["ADMIN", "USER", "ORGANIZER"].includes(role))
      throw new BadRequestException("Gültige Rolle erforderlich.");
    return role as UserRole;
  }
  private async validateRoleLink(role: UserRole, organizerId: string | null) {
    if (role === "ORGANIZER") {
      if (!organizerId) throw new BadRequestException("Veranstalterverknüpfung erforderlich.");
      const organizer = await this.prisma.organizer.findFirst({
        where: { id: organizerId, active: true },
      });
      if (!organizer) throw new BadRequestException("Aktiver Veranstalter nicht gefunden.");
    } else if (organizerId)
      throw new BadRequestException("Nur Veranstalterkonten dürfen verknüpft werden.");
  }
  private async ensureAnotherAdmin(userId: string) {
    if (
      (await this.prisma.user.count({
        where: { role: "ADMIN", status: "ACTIVE", NOT: { id: userId } },
      })) === 0
    )
      throw new ConflictException(
        "Der letzte aktive Admin kann nicht deaktiviert oder herabgestuft werden.",
      );
  }
  private validEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  private validatePassword(password: string) {
    if (
      password.length < 10 ||
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/\d/.test(password)
    )
      throw new BadRequestException(
        "Passwort muss mindestens 10 Zeichen, Groß-/Kleinbuchstaben und eine Zahl enthalten.",
      );
  }
  private url(parameter: string, token: string) {
    const base = (process.env.APP_BASE_URL ?? "http://localhost:4173").replace(/\/$/, "");
    return `${base}/?${parameter}=${encodeURIComponent(token)}`;
  }
  private snapshot(user: {
    id: string;
    displayName: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    financeAccess: boolean;
    organizerId: string | null;
  }) {
    return {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      status: user.status,
      financeAccess: user.role === "ADMIN" || user.financeAccess,
      organizerId: user.organizerId,
    };
  }
  private rethrowUnique(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      throw new ConflictException("E-Mail-Adresse wird bereits verwendet.");
    throw error;
  }
}
