export type PayoutScope = {
  q?: string;
  status?: string;
  eventId?: string;
  year?: string;
  recipientId?: string;
};
export type PayoutAdapter<T> = {
  list(scope: PayoutScope): Promise<T[]>;
  create(input: Record<string, unknown>): Promise<unknown>;
  update(id: string, input: Record<string, unknown>): Promise<unknown>;
  remove(id: string): Promise<unknown>;
  markForMail(ids: string[]): Promise<unknown>;
};
export function createPayoutWorkspace<T>(adapter: PayoutAdapter<T>) {
  let rows: T[] = [];
  let error: string | null = null;
  let snapshot = { rows, error };
  const listeners = new Set<() => void>();
  const publish = () => {
    snapshot = { rows, error };
    listeners.forEach((listener) => listener());
  };
  const load = async (scope: PayoutScope) => {
    try {
      rows = await adapter.list(scope);
      error = null;
      publish();
      return rows;
    } catch (cause) {
      error = cause instanceof Error ? cause.message : "PAYOUT_REQUEST_FAILED";
      publish();
      throw cause;
    }
  };
  const mutate = async (scope: PayoutScope, work: () => Promise<unknown>) => {
    await work();
    return load(scope);
  };
  return {
    snapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    load,
    create: (scope: PayoutScope, input: Record<string, unknown>) =>
      mutate(scope, () => adapter.create(input)),
    update: (scope: PayoutScope, id: string, input: Record<string, unknown>) =>
      mutate(scope, () => adapter.update(id, input)),
    remove: (scope: PayoutScope, id: string) => mutate(scope, () => adapter.remove(id)),
    markForMail: (scope: PayoutScope, ids: string[]) =>
      mutate(scope, () => adapter.markForMail(ids)),
  };
}
export function createHttpPayoutAdapter<T>(): PayoutAdapter<T> {
  const request = async (url: string, method = "GET", body?: unknown) => {
    const response = await fetch(url, {
      method,
      credentials: "include",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) throw new Error("PAYOUT_REQUEST_FAILED");
    return response.status === 204 ? undefined : response.json();
  };
  return {
    list(scope) {
      const params = new URLSearchParams(
        Object.entries(scope).filter(([, value]) => value) as [string, string][],
      );
      return request(`/api/v1/payouts?${params}`) as Promise<T[]>;
    },
    create: (input) => request("/api/v1/payouts", "POST", input),
    update: (id, input) => request(`/api/v1/payouts/${id}`, "PATCH", input),
    remove: (id) => request(`/api/v1/payouts/${id}`, "DELETE"),
    markForMail: (ids) => request("/api/v1/payouts/bulk/mark-for-mail", "POST", { ids }),
  };
}
