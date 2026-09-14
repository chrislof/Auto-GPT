export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

export type EntityId = string & { readonly __brand: "EntityId" };
export type AppId = string & { readonly __brand: "AppId" };
export type AgentId = string & { readonly __brand: "AgentId" };
export type PrincipalId = string & { readonly __brand: "PrincipalId" };
export type ApprovalId = string & { readonly __brand: "ApprovalId" };
export type AuditEventId = string & { readonly __brand: "AuditEventId" };

export function createId<T extends string>(prefix: string): T {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${rand}` as T;
}

export type PermissionAction =
  | "read"
  | "write"
  | "execute"
  | "approve"
  | "admin";

export type ResourceKind =
  | "system"
  | "entity"
  | "metric"
  | "app"
  | "page"
  | "table"
  | "handler"
  | "file"
  | "workflow"
  | "warehouse_query"
  | "agent_tool";

export interface PermissionScope {
  resource: ResourceKind;
  resourceId?: string;
  actions: PermissionAction[];
}

export interface Principal {
  id: PrincipalId;
  kind: "human" | "agent" | "service";
  displayName: string;
  scopes: PermissionScope[];
}

export type FactOrAssumption =
  | { kind: "fact"; source: string; observedAt: string }
  | { kind: "assumption"; rationale: string; needsTest: string };

export interface OutcomeMetric {
  id: string;
  name: string;
  definition: string;
  owner: string;
  unit: string;
  direction: "increase" | "decrease" | "target";
}

export class MindPressError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "MindPressError";
  }
}
