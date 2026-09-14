import type { EntityCatalog } from "./entities.ts";
import { createEntityCatalog } from "./entities.ts";
import type { FreshnessRegistry } from "./freshness.ts";
import { createFreshnessRegistry } from "./freshness.ts";
import type { MetricCatalog } from "./metrics.ts";
import { createMetricCatalog } from "./metrics.ts";
import type { DecisionLog } from "./decisions.ts";
import { createDecisionLog } from "./decisions.ts";
import type { PolicyRegistry } from "./policies.ts";
import { createPolicyRegistry } from "./policies.ts";
import type { SystemRegistry } from "./systems-of-record.ts";
import { createSystemRegistry } from "./systems-of-record.ts";
import type { WorkflowMap } from "./workflows.ts";
import { createWorkflowMap } from "./workflows.ts";
import type {
  BrainExportSection,
  CatalogEntity,
  GovernedBrainSummary,
  GovernedExportOptions,
  PolicyDocument,
  SystemOfRecord,
} from "./types.ts";

const DISCLAIMER =
  "Governed company-brain context only. Facts and assumptions are labeled. " +
  "This summary does not invent customer outcomes, benchmarks, or certainty.";

const SENSITIVE_KEYS = new Set([
  "ssn",
  "salary",
  "compensation",
  "password",
  "secret",
  "token",
  "email",
  "phone",
  "address",
  "bank",
  "account_number",
]);

export interface BrainMap {
  readonly systems: SystemRegistry;
  readonly entities: EntityCatalog;
  readonly metrics: MetricCatalog;
  readonly workflows: WorkflowMap;
  readonly policies: PolicyRegistry;
  readonly freshness: FreshnessRegistry;
  readonly decisions: DecisionLog;

  /**
   * Export a minimum-access, optionally redacted summary for agents.
   * Only requested sections are included; entities require explicit kinds.
   */
  exportGovernedSummary(options: GovernedExportOptions): GovernedBrainSummary;
}

export interface CreateBrainMapOptions {
  systems?: SystemRegistry;
  entities?: EntityCatalog;
  metrics?: MetricCatalog;
  workflows?: WorkflowMap;
  policies?: PolicyRegistry;
  freshness?: FreshnessRegistry;
  decisions?: DecisionLog;
}

function wants(include: BrainExportSection[], section: BrainExportSection): boolean {
  return include.includes(section);
}

function redactAttributes(
  attrs: CatalogEntity["attributes"],
): CatalogEntity["attributes"] {
  const out: CatalogEntity["attributes"] = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      out[key] = "[redacted]";
    } else {
      out[key] = value;
    }
  }
  return out;
}

function systemForAgent(
  s: SystemOfRecord,
  redactSensitive: boolean,
): GovernedBrainSummary["systems"][number] {
  const base = {
    id: s.id,
    name: s.name,
    owner: s.owner,
    authMode: s.authMode,
    freshnessSlaMinutes: s.freshnessSlaMinutes,
    tags: s.tags,
  };
  if (
    redactSensitive &&
    (s.sensitivity === "confidential" || s.sensitivity === "restricted")
  ) {
    return base;
  }
  return { ...base, sensitivity: s.sensitivity };
}

function policyForAgent(
  p: PolicyDocument,
  redactSensitive: boolean,
): GovernedBrainSummary["policies"][number] | null {
  if (
    redactSensitive &&
    (p.sensitivity === "confidential" || p.sensitivity === "restricted")
  ) {
    return {
      id: p.id,
      title: p.title,
      summary: "[redacted — restricted policy]",
      owner: p.owner,
      version: p.version,
      requiredApprovals: p.requiredApprovals,
    };
  }
  return {
    id: p.id,
    title: p.title,
    summary: p.summary,
    owner: p.owner,
    version: p.version,
    requiredApprovals: p.requiredApprovals,
  };
}

export function createBrainMap(options: CreateBrainMapOptions = {}): BrainMap {
  const systems = options.systems ?? createSystemRegistry();
  const entities = options.entities ?? createEntityCatalog();
  const metrics = options.metrics ?? createMetricCatalog();
  const workflows = options.workflows ?? createWorkflowMap();
  const policies = options.policies ?? createPolicyRegistry();
  const freshness = options.freshness ?? createFreshnessRegistry();
  const decisions = options.decisions ?? createDecisionLog();

  return {
    systems,
    entities,
    metrics,
    workflows,
    policies,
    freshness,
    decisions,

    exportGovernedSummary(opts) {
      const redact = opts.redactSensitive !== false;
      const include = opts.include;
      const empty: GovernedBrainSummary = {
        generatedAt: new Date().toISOString(),
        principalId: opts.principalId,
        sections: include,
        systems: [],
        entities: [],
        metrics: [],
        workflows: [],
        exceptions: [],
        policies: [],
        freshness: [],
        quality: [],
        decisions: [],
        disclaimer: DISCLAIMER,
      };

      if (wants(include, "systems")) {
        empty.systems = systems
          .list()
          .map((s) => systemForAgent(s, redact));
      }

      if (wants(include, "entities")) {
        const kinds = opts.entityKinds ?? [];
        empty.entities = entities.listAgentVisible(kinds).map((e) => ({
          id: e.id,
          kind: e.kind,
          displayName: e.displayName,
          owner: e.owner,
          attributes: redact ? redactAttributes(e.attributes) : e.attributes,
        }));
      }

      if (wants(include, "metrics")) {
        empty.metrics = metrics.list().map((m) => ({
          id: m.id,
          name: m.name,
          definition: m.definition,
          owner: m.owner,
          unit: m.unit,
          direction: m.direction,
          sourceFields: m.sourceFields,
          evidenceKind: m.evidence.kind,
        }));
      }

      if (wants(include, "workflows")) {
        empty.workflows = workflows.listWorkflows().map((w) => ({
          id: w.id,
          name: w.name,
          description: w.description,
          owner: w.owner,
          steps: w.steps,
        }));
      }

      if (wants(include, "exceptions")) {
        empty.exceptions = workflows.listExceptions().map((e) => ({
          id: e.id,
          workflowId: e.workflowId,
          name: e.name,
          owner: e.owner,
          escalation: e.escalation,
          severity: e.severity,
        }));
      }

      if (wants(include, "policies")) {
        empty.policies = policies
          .list()
          .map((p) => policyForAgent(p, redact))
          .filter((p): p is NonNullable<typeof p> => p !== null);
      }

      if (wants(include, "freshness")) {
        empty.freshness = freshness.listChecks().map((c) => ({
          id: c.id,
          systemId: c.systemId,
          checkedAt: c.checkedAt,
          observedLagMinutes: c.observedLagMinutes,
          status: c.status,
        }));
      }

      if (wants(include, "quality")) {
        empty.quality = freshness.listQuality().map((q) => ({
          id: q.id,
          systemId: q.systemId,
          kind: q.kind,
          score: q.score,
          evidenceKind: q.evidence.kind,
        }));
      }

      if (wants(include, "decisions")) {
        empty.decisions = decisions.list().map((d) => ({
          id: d.id,
          title: d.title,
          summary: d.summary,
          owner: d.owner,
          decidedAt: d.decidedAt,
          status: d.status,
          evidence: d.evidenceLinks.map((l) => ({
            label: l.label,
            kind: l.evidence.kind,
          })),
        }));
      }

      return empty;
    },
  };
}
