import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, Res } from "@nestjs/common";
import type { Request } from "express";
import type { Response } from "express";
import { ProjectManagementService, type PmActor } from "./project-management.service.js";
import { AllowOrganizer } from "./authorization.js";
type AuthRequest = Request & { user: PmActor };
@AllowOrganizer()
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
  @Post("groups/reorder") reorderGroups(
    @Body() body: Parameters<ProjectManagementService["reorderGroups"]>[0],
    @Req() req: AuthRequest,
  ) {
    return this.pm.reorderGroups(body, req.user);
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
  @Get("tasks/:id/attachments") attachments(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthRequest,
  ) {
    return this.pm.attachments(id, req.user);
  }
  @Post("tasks/:id/attachments") uploadAttachment(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: Parameters<ProjectManagementService["uploadAttachment"]>[1],
    @Req() req: AuthRequest,
  ) {
    return this.pm.uploadAttachment(id, body, req.user);
  }
  @Get("tasks/:id/attachments/:attachmentId") async downloadAttachment(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("attachmentId", ParseUUIDPipe) attachmentId: string,
    @Req() req: AuthRequest,
    @Res() res: Response,
  ) {
    const file = await this.pm.attachment(id, attachmentId, req.user);
    res.setHeader("Content-Type", file.mimeType);
    res.setHeader("Content-Length", file.size);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
    );
    res.send(file.content);
  }
}
