import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { AuditService } from "./audit.service.js";
import { PayoutService } from "./payout.service.js";
import { PayoutImportService } from "./payout-import.service.js";
import { AutomationService } from "./automation.service.js";

@Controller("api/v1/payouts")
export class PayoutController {
  constructor(private readonly payouts:PayoutService, private readonly audit:AuditService, private readonly importer:PayoutImportService) {}
  @Get() list(@Query() q:any){return this.payouts.list(q)}
  @Post() create(@Body() body:any){return this.payouts.create(body)}
  @Patch(":id") update(@Param("id") id:string,@Body() body:any){return this.payouts.update(id,body)}
  @Delete(":id") remove(@Param("id") id:string){return this.payouts.remove(id)}
  @Post("bulk/mark-for-mail") mark(@Body() body:{ids:string[]}){return this.payouts.markForMail(body.ids)}
  @Post("import") import(@Body() body:{rows:any[];preview?:boolean}){return this.importer.run(body.rows,body.preview!==false)}
  @Get("audit") auditLog(@Query("entityId") entityId?:string){return this.audit.list("Payout",entityId)}
}

@Controller("api/v1/automation")
export class AutomationController {
  constructor(private readonly payouts:PayoutService, private readonly automation:AutomationService) {}
  @Post("claims") claimGeneric(@Body() body:{domain:string;recordId:string;idempotencyKey:string;workflowId?:string}){return this.automation.claim(body)}
  @Post("claims/:key/complete") complete(@Param("key") key:string){return this.automation.complete(key)}
  @Post("payouts/claim") claim(@Body() body:{idempotencyKey:string;workflowId?:string}){return this.payouts.claim(body.idempotencyKey,body.workflowId)}
  @Post("payouts/:id/result") result(@Param("id") id:string,@Body() body:any){return this.payouts.result(id,body)}
}
