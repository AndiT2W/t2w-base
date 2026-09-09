export const HARDWARE_ISSUE_TYPES = ["PARTICIPANT", "RENTAL", "OTHER"] as const;
export type HardwareIssueType = (typeof HARDWARE_ISSUE_TYPES)[number];
export const HARDWARE_STATUSES = [
  "OPEN",
  "MAIL_SEND",
  "NOTIFIED",
  "RETURNED",
  "COMPLETED",
] as const;
export type HardwareStatus = (typeof HARDWARE_STATUSES)[number];
export type ObjectNumberType = "SINGLE" | "RANGE" | "NONE";
export type HardwareInput = {
  recipientName?: string;
  issueType: HardwareIssueType;
  objectName: string;
  objectNumberType: ObjectNumberType;
  objectNumberSingle?: string;
  objectNumberPrefix?: string;
  objectNumberFrom?: number;
  objectNumberTo?: number;
  objectNumberPadding?: number;
  quantity?: number;
};
export function normalizeHardwareInput(input: HardwareInput) {
  if (!input.objectName.trim()) throw new Error("OBJECT_NAME_REQUIRED");
  if (input.objectNumberType === "SINGLE" && !input.objectNumberSingle?.trim())
    throw new Error("OBJECT_NUMBER_REQUIRED");
  if (
    input.objectNumberType === "RANGE" &&
    (!input.objectNumberPrefix?.trim() ||
      input.objectNumberFrom == null ||
      input.objectNumberTo == null)
  )
    throw new Error("RANGE_REQUIRED");
  if (input.objectNumberType === "RANGE" && input.objectNumberFrom! > input.objectNumberTo!)
    throw new Error("RANGE_INVALID");
  const quantity =
    input.objectNumberType === "RANGE"
      ? input.objectNumberTo! - input.objectNumberFrom! + 1
      : (input.quantity ?? 1);
  if (!Number.isInteger(quantity) || quantity < 1) throw new Error("QUANTITY_INVALID");
  return { ...input, objectName: input.objectName.trim(), quantity };
}
export function formatObjectNumber(input: HardwareInput) {
  if (input.objectNumberType === "SINGLE") return input.objectNumberSingle ?? "";
  if (input.objectNumberType === "RANGE") {
    const pad = input.objectNumberPadding ?? 0;
    const f = (v: number) => String(v).padStart(pad, "0");
    return `${input.objectNumberPrefix}${f(input.objectNumberFrom!)}–${input.objectNumberPrefix}${f(input.objectNumberTo!)}`;
  }
  return "—";
}
export function isHardwareOverdue(
  dueDate: string | Date | null | undefined,
  status: HardwareStatus,
  today = new Date(),
) {
  if (!dueDate || status === "RETURNED" || status === "COMPLETED") return false;
  const due =
    typeof dueDate === "string" ? dueDate.slice(0, 10) : dueDate.toISOString().slice(0, 10);
  return due < today.toISOString().slice(0, 10);
}
