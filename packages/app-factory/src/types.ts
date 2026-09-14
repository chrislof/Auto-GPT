import type {
  AppId,
  OutcomeMetric,
  PermissionScope,
  PrincipalId,
} from "@mindpress/shared";

/** Audience boundary for an operating application. */
export type AppVisibility = "internal" | "external";

/** Lifecycle state of a registered app. */
export type AppStatus = "draft" | "active" | "paused" | "retired";

/** Column kinds supported by flexible app-owned tables. */
export type TableFieldType =
  | "string"
  | "number"
  | "boolean"
  | "datetime"
  | "json"
  | "ref"
  | "enum";

export interface TableFieldDefinition {
  name: string;
  type: TableFieldType;
  required?: boolean;
  /** For `enum` fields. */
  enumValues?: string[];
  /** For `ref` fields — target table id within the same app. */
  refTableId?: string;
  description?: string;
}

/** Flexible schema definition for an app-owned data table. */
export interface TableDefinition {
  id: string;
  name: string;
  description?: string;
  fields: TableFieldDefinition[];
  primaryKey: string;
  indexes?: string[];
}

/** UI page owned by an app. */
export interface PageDefinition {
  id: string;
  title: string;
  path: string;
  /** Optional table/handler bindings the page reads or invokes. */
  tableIds?: string[];
  handlerIds?: string[];
  description?: string;
}

/**
 * Server-side handler contract.
 * Implementations run inside an isolated runtime (see HandlerRuntime).
 */
export interface HandlerDefinition {
  id: string;
  name: string;
  description?: string;
  /** Entry module path relative to the app bundle. */
  entry: string;
  /** Allowed principals / scopes that may invoke this handler. */
  allowlist: PermissionScope[];
  timeoutMs: number;
  /** Whether the handler may write app tables (default read-only). */
  mutable?: boolean;
}

export type WorkflowTrigger =
  | { kind: "manual" }
  | { kind: "schedule"; cron: string }
  | { kind: "event"; eventType: string }
  | { kind: "queue"; queueName: string };

export type WorkflowStep =
  | { kind: "handler"; handlerId: string }
  | { kind: "queue"; queueName: string; payloadTemplate?: Record<string, unknown> }
  | { kind: "approval"; requiredScopes: PermissionScope[] }
  | { kind: "warehouse_query"; queryId: string };

/** Multi-step workflow / queue orchestration owned by an app. */
export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  /** Idempotency key template for retries. */
  idempotencyKey?: string;
}

/** Private file object metadata (bytes live behind FileStorage). */
export interface FileObject {
  id: string;
  appId: AppId;
  path: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
  createdBy: PrincipalId;
  /** Optional retention / classification tags. */
  tags?: string[];
}

/**
 * Governed warehouse query request.
 * Execution requires a signed, scoped token — never raw DB credentials.
 */
export interface WarehouseQuery {
  id: string;
  appId: AppId;
  /** Logical warehouse / dataset name (e.g. company_ops). */
  warehouse: string;
  /** Read-only SQL text; must not mutate. */
  sql: string;
  /** Maximum rows the caller may receive. */
  maxRows: number;
  requestedBy: PrincipalId;
  createdAt: string;
}

/** Short-lived signed access token for a warehouse query. */
export interface SignedQueryToken {
  /** Opaque signature over the scoped claims. */
  signature: string;
  queryId: string;
  appId: AppId;
  principalId: PrincipalId;
  /** ISO-8601 expiry. */
  expiresAt: string;
  /** Allowed warehouses / datasets. */
  warehouses: string[];
  /** Hard cap on rows for this token. */
  maxRows: number;
}

/** Access policy attached to every app. */
export interface AppAccessPolicy {
  visibility: AppVisibility;
  /** Principals / roles that may administer the app. */
  adminScopes: PermissionScope[];
  /** Default scopes for end users of the app. */
  userScopes: PermissionScope[];
  /** Optional allowlisted principal ids for external apps. */
  allowlistPrincipalIds?: PrincipalId[];
}

/**
 * Source-of-truth declaration: which systems own the data this app reads/writes.
 */
export interface SourceOfTruth {
  /** Primary system of record name. */
  primary: string;
  /** Secondary systems this app may sync from/to. */
  secondary?: string[];
  /** How freshness is judged (e.g. "eventual via connector X"). */
  freshnessNotes?: string;
}

/**
 * Measurable outcome the app exists to improve.
 * Prefer OutcomeMetric from @mindpress/shared when available.
 */
export interface AppOutcome {
  metric: OutcomeMetric;
  /** Baseline value or description before install. */
  baseline?: string;
  /** Target value or description. */
  target?: string;
}

/**
 * Company app factory product definition.
 * Completeness requires owner, source of truth, access policy,
 * measurable outcome, and rollback path.
 */
export interface App {
  id: AppId;
  name: string;
  description: string;
  status: AppStatus;
  visibility: AppVisibility;
  /** Human or team accountable for the app. */
  owner: string;
  sourceOfTruth: SourceOfTruth;
  accessPolicy: AppAccessPolicy;
  outcome: AppOutcome;
  rollbackPlanId: string;
  tables: TableDefinition[];
  pages: PageDefinition[];
  handlers: HandlerDefinition[];
  workflows: WorkflowDefinition[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

/** Input for creating a new app (id/timestamps assigned by registry). */
export type CreateAppInput = Omit<
  App,
  "id" | "createdAt" | "updatedAt" | "version"
> & {
  id?: AppId;
};

/** Partial update — identity and versioning managed by registry. */
export type UpdateAppInput = Partial<
  Omit<App, "id" | "createdAt" | "updatedAt" | "version">
>;

/** Checklist item produced by rollback rehearsal helpers. */
export interface RollbackChecklistItem {
  id: string;
  label: string;
  required: boolean;
  completed: boolean;
  notes?: string;
}

/**
 * Rehearsed rollback path required for every production app.
 * A plan without a completed rehearsal is not considered ready.
 */
export interface RollbackPlan {
  id: string;
  appId: AppId;
  /** Human-readable summary of how to restore the prior operating state. */
  summary: string;
  /** Concrete steps operators follow during rollback. */
  steps: string[];
  /** Systems / data stores touched by rollback. */
  affectedSystems: string[];
  /** Who may authorize the rollback. */
  authorizationScopes: PermissionScope[];
  /** ISO-8601 of last successful rehearsal, if any. */
  lastRehearsedAt?: string;
  checklist: RollbackChecklistItem[];
}
