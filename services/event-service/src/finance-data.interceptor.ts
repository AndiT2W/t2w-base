import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { map } from "rxjs/operators";

const FINANCE_KEYS = new Set([
  "financeNotes",
  "payoutRecipient",
  "payoutRecipientId",
  "iban",
  "bic",
  "bankName",
]);

function sanitize(value: unknown): unknown {
  if (
    value === null ||
    typeof value !== "object" ||
    value instanceof Date ||
    Buffer.isBuffer(value)
  )
    return value;
  if (Array.isArray(value)) return value.map(sanitize);
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !FINANCE_KEYS.has(key))
      .map(([key, nested]) => [key, sanitize(nested)]),
  );
}

@Injectable()
export class FinanceDataInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const user = context.switchToHttp().getRequest().user as
      { role?: string; financeAccess?: boolean } | undefined;
    if (!user || user.role === "ADMIN" || user.financeAccess) return next.handle();
    return next.handle().pipe(map(sanitize));
  }
}
