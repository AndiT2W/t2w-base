export type AutomationClaim<T> = {
  domain: string;
  recordId: string;
  idempotencyKey: string;
  workflowId?: string;
  record: T;
};
export type AutomationResult = {
  success: boolean;
  correlationId?: string;
  externalId?: string;
  workflowId?: string;
  error?: string;
  retryAfter?: string;
};
export type AutomationProjection = {
  status: "CLAIMED" | "COMPLETED" | "RETRYABLE";
  retryCount: number;
  lastError?: string;
  claimedAt?: string;
  completedAt?: string;
};

export function applyAutomationResult(
  current: AutomationProjection,
  result: AutomationResult,
  now = new Date().toISOString(),
): AutomationProjection {
  if (result.success) {
    const { lastError: _lastError, ...withoutError } = current;
    return { ...withoutError, status: "COMPLETED", completedAt: now };
  }
  return {
    ...current,
    status: "RETRYABLE",
    retryCount: current.retryCount + 1,
    lastError: result.error ?? "AUTOMATION_FAILED",
  };
}

export function idempotencyKey(domain: string, recordId: string, workflowId: string) {
  return `${domain}:${recordId}:${workflowId}`;
}
