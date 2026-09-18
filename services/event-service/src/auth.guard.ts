import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { AuthService } from "./auth.service.js";
import { ALLOW_ORGANIZER, REQUIRED_ROLES, REQUIRE_FINANCE } from "./authorization.js";
import type { UserRole } from "@prisma/client";

export const Public = () => SetMetadata("public", true);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
  ) {}
  async canActivate(context: ExecutionContext) {
    if (
      this.reflector.getAllAndOverride<boolean>("public", [
        context.getHandler(),
        context.getClass(),
      ])
    )
      return true;
    const request = context.switchToHttp().getRequest<Request>();
    try {
      const user = await this.auth.userForToken(request.cookies?.t2w_session);
      (request as Request & { user?: unknown }).user = user;
      const targets = [context.getHandler(), context.getClass()];
      const organizerAllowed = this.reflector.getAllAndOverride<boolean>(ALLOW_ORGANIZER, targets);
      if (user.role === "ORGANIZER" && !organizerAllowed)
        throw new ForbiddenException("Keine Berechtigung.");
      const roles = this.reflector.getAllAndOverride<UserRole[]>(REQUIRED_ROLES, targets);
      if (roles?.length && !roles.includes(user.role))
        throw new ForbiddenException("Keine Berechtigung.");
      const finance = this.reflector.getAllAndOverride<boolean>(REQUIRE_FINANCE, targets);
      if (finance && user.role !== "ADMIN" && !user.financeAccess)
        throw new ForbiddenException("Kein Zugriff auf Finanzen.");
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      throw new UnauthorizedException();
    }
  }
}
