import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import type { UserStatus } from "@prisma/client";
import type { Request } from "express";
import { Roles } from "./authorization.js";
import { UserManagementService } from "./user-management.service.js";

type AuthRequest = Request & { user: { id: string } };

@Roles("ADMIN")
@Controller("api/v1/users")
export class UserManagementController {
  constructor(private readonly users: UserManagementService) {}

  @Get() list(@Query("status") status?: UserStatus) {
    return this.users.list(status);
  }
  @Post("invite") invite(
    @Body() body: Parameters<UserManagementService["invite"]>[0],
    @Req() req: AuthRequest,
  ) {
    return this.users.invite(body, req.user.id);
  }
  @Post(":id/invitation/resend") resend(@Param("id") id: string, @Req() req: AuthRequest) {
    return this.users.resendInvitation(id, req.user.id);
  }
  @Delete(":id/invitation") revoke(@Param("id") id: string, @Req() req: AuthRequest) {
    return this.users.revokeInvitation(id, req.user.id);
  }
  @Patch(":id") update(
    @Param("id") id: string,
    @Body() body: Parameters<UserManagementService["update"]>[1],
    @Req() req: AuthRequest,
  ) {
    return this.users.update(id, body, req.user.id);
  }
  @Post(":id/unlock") unlock(@Param("id") id: string, @Req() req: AuthRequest) {
    return this.users.unlock(id, req.user.id);
  }
}
