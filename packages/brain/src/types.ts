import type { EntityId, FactOrAssumption, OutcomeMetric } from "@mindpress/shared";

/** Branded brain resource ids (string brands for local registries). */
export type SystemId = string & { readonly __brand: "SystemId" };
export type MetricDefId = string & { readonly __brand: "MetricDefId" };
export type WorkflowId = string & { readonly __brand: "WorkflowId" };
export type ExceptionTypeId = string & { readonly __brand: "ExceptionTypeId" };
export type PolicyId = string & { readonly __brand: "PolicyId" };
export type DecisionId = string & { readonly __brand: "DecisionId" };
export type FreshnessCheckId = string & { readonly __brand: "FreshnessCheckId" };

export type AuthMode =
  | "oauth"
  | "api_key"
  | "service_account"
  | "human_session"
  | "none";

export interface SystemOfRecord {
  id: SystemId;
  name: string;
  description: string;
  owner: string;
  authMode: AuthMode;
  /** Maximum acceptable age of source data in minutes. */
  freshnessSlaMinutes: number;
  sensitivity: "public" | "internal" | "confidential" | "restricted";
  tags: string[];
}

export type EntityKind =
  | "person"
  | "role"
  | "customer"
  | "product"
  | "location"
  | "transaction";

export interface CatalogEntity {
  id: EntityId;
  kind: EntityKind;
  displayName: string;
  /** Owning team or system of record name. */
  owner: string;
  systemId?: SystemId;
  attributes: Record<string, string | number | boolean | null>;
  /** Whether attributes may be shown to agents without redaction. */
  agentVisible: boolean;
}

/** OutcomeMetric plus source-field provenance for the brain catalog. */
export interface MetricDefinition extends OutcomeMetric {
  sourceSystemId?: SystemId;
  sourceFields: string[];
  evidence: FactOrAssumption;
}

export interface WorkflowDefinition {
  id: WorkflowId;
  name: string;
  description: string;
  owner: string;
  /** Ordered high-level steps (names only — not executable). */
  steps: string[];
  relatedMetricIds: MetricDefId[];
  relatedSystemIds: SystemId[];
}

export type EscalationLevel = "owner" | "manager" | "executive" | "compliance";

export interface ExceptionType {
  id: ExceptionTypeId;
  workflowId: WorkflowId;
  name: string;
  description: string;
  owner: string;
  escalation: EscalationLevel;
  /** Severity for routing; not a customer outcome claim. */
  severity: "low" | "medium" | "high" | "critical";
}

export type ApprovalAction =
  | "read"
  | "write"
  | "approve"
  | "publish"
  | "pay"
  | "hire"
  | "terminate"
  | "send_external"
  | "alter_production";

export interface PolicyDocument {
  id: PolicyId;
  title: string;
  summary: string;
  owner: string;
  version: string;
  requiredApprovals: ApprovalAction[];
  /** Consequential actions that must never auto-run without authority. */
  blockedWithoutApproval: ApprovalAction[];
  sensitivity: "public" | "internal" | "confidential" | "restricted";
}

export type FreshnessStatus = "fresh" | "stale" | "unknown" | "failing";

export interface FreshnessCheck {
  id: FreshnessCheckId;
  systemId: SystemId;
  checkedAt: string;
  observedLagMinutes: number;
  status: FreshnessStatus;
  notes?: string;
}

export type QualitySignalKind =
  | "completeness"
  | "uniqueness"
  | "validity"
  | "consistency"
  | "timeliness";

export interface DataQualitySignal {
  id: string;
  systemId: SystemId;
  kind: QualitySignalKind;
  /** 0–1 score; null means not yet measured (do not invent). */
  score: number | null;
  evidence: FactOrAssumption;
  observedAt: string;
}

export interface DecisionRecord {
  id: DecisionId;
  title: string;
  summary: string;
  owner: string;
  decidedAt: string;
  /** Links to systems, metrics, policies, etc. as opaque refs. */
  evidenceLinks: Array<{
    label: string;
    ref: string;
    evidence: FactOrAssumption;
  }>;
  status: "proposed" | "accepted" | "rejected" | "superseded";
}

/** Agent export scopes — minimum access for the task. */
export type BrainExportSection =
  | "systems"
  | "entities"
  | "metrics"
  | "workflows"
  | "exceptions"
  | "policies"
  | "freshness"
  | "quality"
  | "decisions";

export interface GovernedExportOptions {
  principalId: string;
  include: BrainExportSection[];
  /** Entity kinds an agent may see; omit = none for entities. */
  entityKinds?: EntityKind[];
  /** When true, redact restricted/confidential fields and attributes. */
  redactSensitive?: boolean;
}

export interface GovernedBrainSummary {
  generatedAt: string;
  principalId: string;
  sections: BrainExportSection[];
  systems: Array<
    Pick<SystemOfRecord, "id" | "name" | "owner" | "authMode" | "freshnessSlaMinutes" | "tags"> & {
      sensitivity?: SystemOfRecord["sensitivity"];
    }
  >;
  entities: Array<
    Pick<CatalogEntity, "id" | "kind" | "displayName" | "owner"> & {
      attributes?: CatalogEntity["attributes"];
    }
  >;
  metrics: Array<
    Pick<MetricDefinition, "id" | "name" | "definition" | "owner" | "unit" | "direction" | "sourceFields"> & {
      evidenceKind: FactOrAssumption["kind"];
    }
  >;
  workflows: Array<Pick<WorkflowDefinition, "id" | "name" | "description" | "owner" | "steps">>;
  exceptions: Array<
    Pick<ExceptionType, "id" | "workflowId" | "name" | "owner" | "escalation" | "severity">
  >;
  policies: Array<
    Pick<PolicyDocument, "id" | "title" | "summary" | "owner" | "version" | "requiredApprovals">
  >;
  freshness: Array<
    Pick<FreshnessCheck, "id" | "systemId" | "checkedAt" | "observedLagMinutes" | "status">
  >;
  quality: Array<{
    id: string;
    systemId: SystemId;
    kind: QualitySignalKind;
    score: number | null;
    evidenceKind: FactOrAssumption["kind"];
  }>;
  decisions: Array<{
    id: DecisionId;
    title: string;
    summary: string;
    owner: string;
    decidedAt: string;
    status: DecisionRecord["status"];
    evidence: Array<{ label: string; kind: FactOrAssumption["kind"] }>;
  }>;
  /** Explicit disclaimer: summary is structured context, not invented outcomes. */
  disclaimer: string;
}
