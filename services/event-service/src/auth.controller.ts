import { Body, Controller, Get, Patch, Post, Req, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service.js";
import { Public } from "./auth.guard.js";
import { AllowOrganizer } from "./authorization.js";
import { UserManagementService } from "./user-management.service.js";

@ApiTags("auth")
@AllowOrganizer()
@Controller("api/v1/auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UserManagementService,
  ) {}
  @Public() @Post("login") async login(
    @Body() body: { email?: string; password?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.login(
      body.email ?? "",
      body.password ?? "",
      Boolean((body as { rememberMe?: boolean }).rememberMe),
    );
    res.cookie("t2w_session", result.rawToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: result.maxAgeMs,
    });
    return result.user;
  }
  @Post("logout") async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.t2w_session);
    res.clearCookie("t2w_session");
    return { ok: true };
  }
  @Get("me") async me(@Req() req: Request) {
    const user = await this.auth.userForToken(req.cookies?.t2w_session);
    return this.auth.userDto(user);
  }
  @Patch("profile") profile(
    @Req() req: Request & { user?: { id: string } },
    @Body() body: { firstName?: string; lastName?: string },
  ) {
    return this.users.profile(req.user!.id, body);
  }
  @Post("password/change") changePassword(
    @Req() req: Request & { user?: { id: string } },
    @Body() body: { currentPassword?: string; password?: string },
  ) {
    return this.users.changePassword(req.user!.id, body.currentPassword ?? "", body.password ?? "");
  }
  @Public() @Post("activate") activate(
    @Body() body: { token?: string; password?: string; firstName?: string; lastName?: string },
  ) {
    return this.users.activate(body);
  }
  @Public() @Post("password-reset/request") requestReset(@Body() body: { email?: string }) {
    return this.users.requestPasswordReset(body.email ?? "");
  }
  @Public() @Post("password-reset/complete") completeReset(
    @Body() body: { token?: string; password?: string },
  ) {
    return this.users.completePasswordReset(body.token ?? "", body.password ?? "");
  }
  @Post("email-change/request") requestEmailChange(
    @Req() req: Request & { user?: { id: string } },
    @Body() body: { email?: string },
  ) {
    return this.users.requestEmailChange(req.user!.id, body.email ?? "");
  }
  @Public() @Post("email-change/confirm") confirmEmail(@Body() body: { token?: string }) {
    return this.users.confirmEmailChange(body.token ?? "");
  }
}
