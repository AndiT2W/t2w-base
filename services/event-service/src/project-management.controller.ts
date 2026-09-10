import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Req } from "@nestjs/common";
import type { Request } from "express";
import { ProjectManagementService, type PmActor } from "./project-management.service.js";
type AuthRequest = Request & { user: PmActor };
@Controller("api/v1/pm")
export class ProjectManagementController {
  constructor(private readonly pm: ProjectManagementService) {}
  @Post("events/:id/config") configure(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: { graphVersion: number; timeZone: string },
    @Req() req: AuthRequest,
  ) {
    return this.pm.configure(id, body, req.user);
  }
  @Get("events/:id/references") references(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthRequest,
  ) {
    return this.pm.references(id, req.user);
  }
  @Get() global(@Query() query: Record<string, string>, @Req() req: AuthRequest) {
    return this.pm.global(query, req.user);
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
  @Post("events/:id/cutover") cutover(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthRequest,
  ) {
    return this.pm.cutover(id, req.user);
  }
  @Get("tasks/:id/activities") activities(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthRequest,
  ) {
    return this.pm.activities(id, req.user);
  }
  @Get("snapshots/:id") download(@Param("id", ParseUUIDPipe) id: string, @Req() req: AuthRequest) {
    return this.pm.snapshotDownload(id, req.user);
  }
}
