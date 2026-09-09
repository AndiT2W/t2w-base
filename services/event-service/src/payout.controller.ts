import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import type { Request } from "express";
import { AuditService } from "./audit.service.js";
import { PayoutService } from "./payout.service.js";
import { PayoutImportService } from "./payout-import.service.js";
import { AutomationService } from "./automation.service.js";

@Controller("api/v1/payouts")
export class PayoutController {
  constructor(
    private readonly payouts: PayoutService,
    private readonly audit: AuditService,
    private readonly importer: PayoutImportService,
  ) {}
  @Get() list(@Query() q: any) {
    return this.payouts.list(q);
  }
  @Post() create(@Body() body: any, @Req() req: Request) {
    return this.payouts.create({ ...body, userId: (req as any).user?.id });
  }
  @Patch(":id") update(@Param("id") id: string, @Body() body: any, @Req() req: Request) {
    return this.payouts.update(id, { ...body, userId: (req as any).user?.id });
  }
  @Delete(":id") remove(@Param("id") id: string, @Req() req: Request) {
    return this.payouts.remove(id, (req as any).user?.id);
  }
  @Post("bulk/mark-for-mail") mark(@Body() body: { ids: string[] }, @Req() req: Request) {
    return this.payouts.markForMail(body.ids, (req as any).user?.id);
  }
  @Post("import") import(@Body() body: { rows: any[]; preview?: boolean }) {
    return this.importer.run(body.rows, body.preview !== false);
  }
  @Get("audit") auditLog(@Query("entityId") entityId?: string) {
    return this.audit.list("Payout", entityId);
  }
}

@Controller("api/v1/automation")
export class AutomationController {
  constructor(
    private readonly payouts: PayoutService,
    private readonly automation: AutomationService,
  ) {}
  @Post("claims") claimGeneric(
    @Body() body: { domain: string; recordId: string; idempotencyKey: string; workflowId?: string },
  ) {
    return this.automation.claim(body);
  }
  @Post("claim-next") claimNext(
    @Body() body: { domain: string; idempotencyKey: string; workflowId?: string },
  ) {
    return this.automation.claimNext(body);
  }
  @Post("claims/:key/complete") complete(@Param("key") key: string) {
    return this.automation.complete(key);
  }
  @Post("claims/:key/result") genericResult(
    @Param("key") key: string,
    @Body() body: { success: boolean; error?: string; externalId?: string },
  ) {
    return this.automation.result(key, body);
  }
  @Post("payouts/claim") claim(@Body() body: { idempotencyKey: string; workflowId?: string }) {
    return this.payouts.claim(body.idempotencyKey, body.workflowId);
  }
  @Post("payouts/:id/result") result(@Param("id") id: string, @Body() body: any) {
    return this.payouts.result(id, body);
  }
}

@Controller("api/v1/audit-log")
export class AuditLogController {
  constructor(private readonly audit: AuditService) {}
  @Get() list(@Query("entity") entity?: string, @Query("entityId") entityId?: string) {
    return this.audit.list(entity, entityId);
  }
}
