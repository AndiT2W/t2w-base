import { Body, Controller, Get, Post, Req, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service.js";

@ApiTags("auth")
@Controller("api/v1/auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post("login") async login(@Body() body: { email?: string; password?: string }, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login(body.email ?? "", body.password ?? "");
    res.cookie("t2w_session", result.rawToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 8 * 60 * 60 * 1000 });
    return result.user;
  }
  @Post("logout") async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) { await this.auth.logout(req.cookies?.t2w_session); res.clearCookie("t2w_session"); return { ok: true }; }
  @Get("me") async me(@Req() req: Request) { return this.auth.userForToken(req.cookies?.t2w_session); }
}
