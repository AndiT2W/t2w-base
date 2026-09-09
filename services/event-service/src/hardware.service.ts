/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";
import { normalizeHardwareInput } from "@t2w/domain/hardware";
@Injectable()
export class HardwareService {
  constructor(private readonly prisma: PrismaService) {}
  list(
    eventId?: string,
    query?: string,
    skip = 0,
    take = 100,
    status?: string,
    issueType?: string,
  ) {
    return this.prisma.hardwareIssue.findMany({
      where: {
        eventId,
        status: status as any,
        issueType: issueType as any,
        OR: query
          ? [
              { recipientName: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
              { objectNumberSingle: { contains: query, mode: "insensitive" } },
              { objectNumberPrefix: { contains: query, mode: "insensitive" } },
            ]
          : undefined,
      },
      skip,
      take,
      include: { event: { select: { id: true, eventCode: true, name: true } } },
      orderBy: { dueDate: "asc" },
    });
  }
  async create(eventId: string | undefined, input: any) {
    const data = normalizeHardwareInput(input);
    const result = await this.prisma.hardwareIssue.create({
      data: {
        ...data,
        recipientName: input.recipientName?.trim() ?? "",
        eventId: eventId || undefined,
        issuedAt: input.issuedAt ? new Date(input.issuedAt) : undefined,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      },
      include: { event: { select: { id: true, eventCode: true, name: true } } },
    });
    await this.prisma.auditLog.create({
      data: {
        action: "CREATE",
        entity: "HardwareIssue",
        entityId: result.id,
        details: { eventId: eventId ?? null },
      },
    });
    return result;
  }
  async update(eventId: string | undefined, id: string, input: any) {
    const current = await this.prisma.hardwareIssue.findFirstOrThrow({
      where: { id, ...(eventId ? { eventId } : {}) },
    });
    if (
      (current.status === "RETURNED" || current.status === "COMPLETED") &&
      input.status &&
      input.status !== current.status
    )
      throw new Error("HARDWARE_CLOSED");
    const normalizedInput =
      input.objectName || input.objectNumberType
        ? normalizeHardwareInput({ ...current, ...input })
        : input;
    const {
      id: _id,
      eventId: _eventId,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      ...data
    } = normalizedInput;
    for (const key of ["issuedAt", "dueDate", "returnedAt"])
      if (data[key]) data[key] = new Date(data[key]);
    if (input.status === "RETURNED" && !data.returnedAt) data.returnedAt = new Date();
    const result = await this.prisma.hardwareIssue.update({
      where: { id },
      data,
      include: { event: { select: { id: true, eventCode: true, name: true } } },
    });
    await this.prisma.auditLog.create({
      data: {
        action: input.status ? "STATUS_CHANGE" : "UPDATE",
        entity: "HardwareIssue",
        entityId: id,
        details: { from: current.status, to: result.status },
      },
    });
    return result;
  }
  async remove(eventId: string | undefined, id: string) {
    const result = await this.prisma.hardwareIssue.deleteMany({
      where: { id, ...(eventId ? { eventId } : {}), status: { notIn: ["RETURNED", "COMPLETED"] } },
    });
    if (result.count)
      await this.prisma.auditLog.create({
        data: { action: "DELETE", entity: "HardwareIssue", entityId: id },
      });
    return result;
  }
}
