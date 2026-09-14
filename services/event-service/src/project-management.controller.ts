import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req } from "@nestjs/common";
import type { Request } from "express";
import { ProjectManagementService, type PmActor } from "./project-management.service.js";
type AuthRequest = Request & { user: PmActor };
@Controller("api/v1/pm")
export class ProjectManagementController {
  constructor(private readonly pm: ProjectManagementService) {}
  @Get() global(@Req() req: AuthRequest) {
    return this.pm.global(req.user);
  }
  @Post("commands") globalCommand(
    @Body() body: Parameters<ProjectManagementService["globalCommand"]>[0],
    @Req() req: AuthRequest,
  ) {
    return this.pm.globalCommand(body, req.user);
  }
  @Get("groups") groups(@Req() req: AuthRequest) {
    return this.pm.groups(req.user);
  }
  @Post("groups") saveGroup(
    @Body() body: Parameters<ProjectManagementService["saveGroup"]>[0],
    @Req() req: AuthRequest,
  ) {
    return this.pm.saveGroup(body, req.user);
  }
  @Get("events/:id") read(@Param("id", ParseUUIDPipe) id: string, @Req() req: AuthRequest) {
    return this.pm.read(id, req.user);
  }
  @Post("events/:id/commands") command(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: Parameters<ProjectManagementService["command"]>[1],
    @Req() req: AuthRequest,
  ) {
    return this.pm.command(id, body, req.user);
  }
  @Get("tasks/:id/activities") activities(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthRequest,
  ) {
    return this.pm.activities(id, req.user);
  }
  @Get("tasks/:id/comments") comments(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthRequest,
  ) {
    return this.pm.comments(id, req.user);
  }
  @Post("tasks/:id/comments") comment(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: Parameters<ProjectManagementService["comment"]>[1],
    @Req() req: AuthRequest,
  ) {
    return this.pm.comment(id, body, req.user);
  }
}
