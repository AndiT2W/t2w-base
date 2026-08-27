export type DomainCommandResult<T> =
  | { kind: "saved"; value: T }
  | { kind: "conflict" }
  | { kind: "rejected"; reason: string };
