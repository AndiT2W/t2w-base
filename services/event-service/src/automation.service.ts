import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";

@Injectable()
export class AutomationService {
  constructor(private readonly prisma: PrismaService) {}
  async claim(input:{domain:string;recordId:string;idempotencyKey:string;workflowId?:string}) {
    const existing=await this.prisma.automationClaim.findUnique({where:{idempotencyKey:input.idempotencyKey}});
    if(existing) return {...existing,replayed:true};
    return this.prisma.automationClaim.create({data:{domain:input.domain,recordId:input.recordId,idempotencyKey:input.idempotencyKey,workflowId:input.workflowId}});
  }
  complete(idempotencyKey:string) { return this.prisma.automationClaim.update({where:{idempotencyKey},data:{completedAt:new Date()}}); }
}
