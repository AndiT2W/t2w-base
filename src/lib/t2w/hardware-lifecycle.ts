import { normalizeHardwareResponse } from "./hardware-response";

export type HardwareScope = { eventId?: string | null };

function baseUrl(scope: HardwareScope) {
  return scope.eventId && scope.eventId !== "none"
    ? `/api/v1/events/${scope.eventId}/hardware`
    : "/api/v1/events/hardware";
}

async function request<T>(
  url: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  body?: unknown,
) {
  const response = await fetch(url, {
    method,
    credentials: "include",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new Error("HARDWARE_REQUEST_FAILED");
  return response.status === 204 ? undefined : ((await response.json()) as T);
}

/** The intent-level Hardware lifecycle interface used by central and Event-detail callers. */
export const hardwareLifecycle = {
  list<T>(scope: HardwareScope) {
    return request<unknown>(baseUrl(scope), "GET").then(normalizeHardwareResponse<T>);
  },
  save<T>(scope: HardwareScope, draft: Record<string, unknown> & { id?: string }) {
    const { id, ...body } = draft;
    return request<T>(id ? `${baseUrl(scope)}/${id}` : baseUrl(scope), id ? "PATCH" : "POST", body);
  },
  return<T>(scope: HardwareScope, id: string) {
    return request<T>(`${baseUrl(scope)}/${id}`, "PATCH", { status: "RETURNED" });
  },
  remove(scope: HardwareScope, id: string) {
    return request(`${baseUrl(scope)}/${id}`, "DELETE");
  },
};
