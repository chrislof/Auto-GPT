import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createBrainMap } from "./brain-map.ts";
import { createDecisionLog } from "./decisions.ts";
import { createEntityCatalog } from "./entities.ts";
import { createFreshnessRegistry } from "./freshness.ts";
import { createMetricCatalog } from "./metrics.ts";
import { createPolicyRegistry } from "./policies.ts";
import { createSystemRegistry } from "./systems-of-record.ts";
import { createWorkflowMap } from "./workflows.ts";

describe("systems of record", () => {
  it("registers systems with owner, auth, and freshness SLA", () => {
    const systems = createSystemRegistry();
    const result = systems.register({
      name: "NetSuite",
      description: "ERP",
      owner: "finance-ops",
      authMode: "service_account",
      freshnessSlaMinutes: 60,
      sensitivity: "confidential",
      tags: ["erp", "finance"],
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.value.name, "NetSuite");
    assert.equal(result.value.authMode, "service_account");
    assert.equal(result.value.freshnessSlaMinutes, 60);
    assert.equal(systems.list().length, 1);
  });

  it("rejects duplicate system names", () => {
    const systems = createSystemRegistry();
    systems.register({
      name: "HubSpot",
      owner: "revops",
      authMode: "oauth",
      freshnessSlaMinutes: 15,
    });
    const dup = systems.register({
      name: "hubspot",
      owner: "revops",
      authMode: "oauth",
      freshnessSlaMinutes: 15,
    });
    assert.equal(dup.ok, false);
  });
});

describe("entity catalog", () => {
  it("stores typed entity kinds and respects agent visibility", () => {
    const catalog = createEntityCatalog();
    const person = catalog.register({
      kind: "person",
      displayName: "Alex Rivera",
      owner: "hr",
      attributes: { email: "alex@example.com", role: "controller" },
      agentVisible: true,
    });
    const customer = catalog.register({
      kind: "customer",
      displayName: "Acme Co",
      owner: "sales",
      agentVisible: false,
    });
    assert.equal(person.ok, true);
    assert.equal(customer.ok, true);
    assert.equal(catalog.list("person").length, 1);
    assert.equal(catalog.listAgentVisible(["person"]).length, 1);
    assert.equal(catalog.listAgentVisible(["customer"]).length, 0);
    assert.equal(catalog.listAgentVisible().length, 0);
  });
});

describe("metric definitions", () => {
  it("registers OutcomeMetric-compatible definitions with source fields", () => {
    const metrics = createMetricCatalog();
    const result = metrics.register({
      name: "Gross margin %",
      definition: "Gross profit / revenue for closed periods",
      owner: "fp&a",
      unit: "percent",
      direction: "increase",
      sourceFields: ["gross_profit", "revenue"],
      evidence: {
        kind: "fact",
        source: "finance.closed_books",
        observedAt: "2026-09-01T00:00:00.000Z",
      },
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.value.unit, "percent");
    assert.deepEqual(result.value.sourceFields, ["gross_profit", "revenue"]);
  });

  it("rejects assumption metrics without needsTest", () => {
    const metrics = createMetricCatalog();
    const result = metrics.register({
      name: "Projected uplift",
      definition: "Speculative",
      owner: "growth",
      unit: "percent",
      direction: "increase",
      evidence: {
        kind: "assumption",
        rationale: "hoped improvement",
        needsTest: "   ",
      },
    });
    assert.equal(result.ok, false);
  });
});

describe("workflow + exception map", () => {
  it("registers workflows and linked exceptions with escalation", () => {
    const map = createWorkflowMap();
    const wf = map.registerWorkflow({
      name: "Invoice match",
      owner: "ap",
      steps: ["ingest", "match", "exception queue", "post"],
    });
    assert.equal(wf.ok, true);
    if (!wf.ok) return;

    const exc = map.registerException({
      workflowId: wf.value.id,
      name: "Amount mismatch",
      owner: "ap-lead",
      escalation: "manager",
      severity: "high",
    });
    assert.equal(exc.ok, true);
    if (!exc.ok) return;
    assert.equal(exc.value.escalation, "manager");
    assert.equal(map.listExceptions(wf.value.id).length, 1);
  });

  it("rejects exceptions for unknown workflows", () => {
    const map = createWorkflowMap();
    const exc = map.registerException({
      workflowId: "wf_missing" as never,
      name: "Ghost",
      owner: "ops",
      escalation: "owner",
    });
    assert.equal(exc.ok, false);
  });
});

describe("policy + approval boundaries", () => {
  it("stores required and blocked approval actions", () => {
    const policies = createPolicyRegistry();
    const result = policies.register({
      title: "Payment authority",
      summary: "Payments require dual approval above threshold",
      owner: "controller",
      requiredApprovals: ["approve", "pay"],
      blockedWithoutApproval: ["pay"],
    });
    assert.equal(result.ok, true);
    assert.equal(policies.requiring("pay").length, 1);
  });
});

describe("source freshness / data quality", () => {
  it("derives freshness status from SLA", () => {
    const systems = createSystemRegistry();
    const sys = systems.register({
      name: "Warehouse",
      owner: "data",
      authMode: "service_account",
      freshnessSlaMinutes: 30,
    });
    assert.equal(sys.ok, true);
    if (!sys.ok) return;

    const freshness = createFreshnessRegistry();
    const fresh = freshness.recordCheck(
      { systemId: sys.value.id, observedLagMinutes: 10 },
      systems,
    );
    const stale = freshness.recordCheck(
      { systemId: sys.value.id, observedLagMinutes: 45 },
      systems,
    );
    const failing = freshness.recordCheck(
      { systemId: sys.value.id, observedLagMinutes: 120 },
      systems,
    );
    assert.equal(fresh.ok && fresh.value.status, "fresh");
    assert.equal(stale.ok && stale.value.status, "stale");
    assert.equal(failing.ok && failing.value.status, "failing");
  });

  it("does not allow scored quality signals on assumptions", () => {
    const systems = createSystemRegistry();
    const sys = systems.register({
      name: "CRM",
      owner: "revops",
      authMode: "oauth",
      freshnessSlaMinutes: 15,
    });
    assert.equal(sys.ok, true);
    if (!sys.ok) return;

    const freshness = createFreshnessRegistry();
    const bad = freshness.recordQuality(
      {
        systemId: sys.value.id,
        kind: "completeness",
        score: 0.9,
        evidence: {
          kind: "assumption",
          rationale: "seems fine",
          needsTest: "sample 100 records",
        },
      },
      systems,
    );
    assert.equal(bad.ok, false);

    const okSignal = freshness.recordQuality(
      {
        systemId: sys.value.id,
        kind: "completeness",
        score: null,
        evidence: {
          kind: "assumption",
          rationale: "not measured yet",
          needsTest: "sample 100 records",
        },
      },
      systems,
    );
    assert.equal(okSignal.ok, true);
  });
});

describe("decision log", () => {
  it("separates fact evidence from assumptions", () => {
    const log = createDecisionLog();
    const result = log.register({
      title: "Adopt weekly exception review",
      summary: "AP will review amount-mismatch queue every Monday",
      owner: "controller",
      status: "accepted",
      evidenceLinks: [
        {
          label: "queue volume last 30d",
          ref: "dq:ap-mismatches",
          evidence: {
            kind: "fact",
            source: "ap.exception_queue",
            observedAt: "2026-09-10T00:00:00.000Z",
          },
        },
        {
          label: "expected time savings",
          ref: "assumption:time",
          evidence: {
            kind: "assumption",
            rationale: "managers estimate 2h/week saved",
            needsTest: "time-motion study after 4 weeks",
          },
        },
      ],
    });
    assert.equal(result.ok, true);
    const factsOnly = log.listWithFactsOnly();
    assert.equal(factsOnly.length, 1);
    assert.equal(factsOnly[0]?.evidenceLinks.length, 1);
    assert.equal(factsOnly[0]?.evidenceLinks[0]?.evidence.kind, "fact");
  });
});

describe("BrainMap facade", () => {
  it("assembles registries and exports a governed agent summary", () => {
    const brain = createBrainMap();

    const sys = brain.systems.register({
      name: "ERP",
      owner: "finance",
      authMode: "service_account",
      freshnessSlaMinutes: 60,
      sensitivity: "restricted",
    });
    assert.equal(sys.ok, true);
    if (!sys.ok) return;

    brain.entities.register({
      kind: "customer",
      displayName: "Acme",
      owner: "sales",
      attributes: { email: "secret@acme.com", segment: "enterprise" },
      agentVisible: true,
    });
    brain.entities.register({
      kind: "product",
      displayName: "Widget",
      owner: "product",
      agentVisible: true,
    });

    brain.metrics.register({
      name: "Contribution margin",
      definition: "Revenue minus variable cost",
      owner: "fp&a",
      unit: "currency",
      direction: "increase",
      sourceFields: ["revenue", "variable_cost"],
      evidence: {
        kind: "fact",
        source: "finance.pnl",
        observedAt: "2026-09-01T00:00:00.000Z",
      },
    });

    const wf = brain.workflows.registerWorkflow({
      name: "Close",
      owner: "controller",
      steps: ["accrue", "reconcile", "lock"],
    });
    assert.equal(wf.ok, true);
    if (!wf.ok) return;
    brain.workflows.registerException({
      workflowId: wf.value.id,
      name: "Unmatched accrual",
      owner: "controller",
      escalation: "executive",
    });

    brain.policies.register({
      title: "External send",
      summary: "Customer emails need brand approval",
      owner: "marketing",
      requiredApprovals: ["send_external"],
      sensitivity: "confidential",
    });

    brain.freshness.recordCheck(
      { systemId: sys.value.id, observedLagMinutes: 5 },
      brain.systems,
    );
    brain.freshness.recordQuality(
      {
        systemId: sys.value.id,
        kind: "timeliness",
        score: 0.95,
        evidence: {
          kind: "fact",
          source: "freshness.monitor",
          observedAt: "2026-09-14T00:00:00.000Z",
        },
      },
      brain.systems,
    );

    brain.decisions.register({
      title: "Keep ERP as SoR for GL",
      summary: "Do not duplicate GL elsewhere",
      owner: "cfo",
      status: "accepted",
      evidenceLinks: [
        {
          label: "current architecture",
          ref: "sys:erp",
          evidence: {
            kind: "fact",
            source: "architecture.md",
            observedAt: "2026-09-13T00:00:00.000Z",
          },
        },
      ],
    });

    const summary = brain.exportGovernedSummary({
      principalId: "agent_ops_1",
      include: [
        "systems",
        "entities",
        "metrics",
        "workflows",
        "exceptions",
        "policies",
        "freshness",
        "quality",
        "decisions",
      ],
      entityKinds: ["customer"],
      redactSensitive: true,
    });

    assert.equal(summary.principalId, "agent_ops_1");
    assert.equal(summary.systems.length, 1);
    assert.equal(summary.systems[0]?.sensitivity, undefined);
    assert.equal(summary.entities.length, 1);
    assert.equal(summary.entities[0]?.kind, "customer");
    assert.equal(summary.entities[0]?.attributes?.email, "[redacted]");
    assert.equal(summary.entities[0]?.attributes?.segment, "enterprise");
    assert.equal(summary.metrics.length, 1);
    assert.equal(summary.metrics[0]?.evidenceKind, "fact");
    assert.equal(summary.workflows.length, 1);
    assert.equal(summary.exceptions.length, 1);
    assert.equal(summary.policies[0]?.summary, "[redacted — restricted policy]");
    assert.equal(summary.freshness[0]?.status, "fresh");
    assert.equal(summary.quality[0]?.score, 0.95);
    assert.equal(summary.decisions[0]?.evidence[0]?.kind, "fact");
    assert.match(summary.disclaimer, /does not invent customer outcomes/i);
  });

  it("exports only requested sections (minimum access)", () => {
    const brain = createBrainMap();
    brain.systems.register({
      name: "CRM",
      owner: "revops",
      authMode: "oauth",
      freshnessSlaMinutes: 10,
    });
    brain.metrics.register({
      name: "Pipeline",
      definition: "Open opportunity amount",
      owner: "sales",
      unit: "currency",
      direction: "increase",
      evidence: {
        kind: "assumption",
        rationale: "CRM amounts trusted",
        needsTest: "reconcile to bookings",
      },
    });

    const summary = brain.exportGovernedSummary({
      principalId: "agent_limited",
      include: ["metrics"],
    });
    assert.equal(summary.systems.length, 0);
    assert.equal(summary.metrics.length, 1);
    assert.equal(summary.metrics[0]?.evidenceKind, "assumption");
  });
});
