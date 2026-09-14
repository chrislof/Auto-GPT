import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createId,
  type Principal,
  type PrincipalId,
} from "@mindpress/shared";
import {
  ApprovalGate,
  AuditLog,
  PermissionChecker,
  createGovernance,
} from "./index.js";

function principal(
  scopes: Principal["scopes"],
  kind: Principal["kind"] = "agent",
): Principal {
  return {
    id: createId<PrincipalId>("prn"),
    kind,
    displayName: "Test Principal",
    scopes,
  };
}

describe("PermissionChecker", () => {
  const checker = new PermissionChecker();

  it("allows matching scope", () => {
    const p = principal([
      { resource: "entity", actions: ["read"] },
    ]);
    const result = checker.check({
      principal: p,
      resource: "entity",
      action: "read",
    });
    assert.equal(result.ok, true);
  });

  it("denies missing action", () => {
    const p = principal([
      { resource: "entity", actions: ["read"] },
    ]);
    const result = checker.check({
      principal: p,
      resource: "entity",
      action: "write",
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, "PERMISSION_DENIED");
    }
  });

  it("denies when resourceId scope does not match", () => {
    const p = principal([
      { resource: "app", resourceId: "app_a", actions: ["read"] },
    ]);
    const result = checker.check({
      principal: p,
      resource: "app",
      resourceId: "app_b",
      action: "read",
    });
    assert.equal(result.ok, false);
  });

  it("admin action grants any requested action on matching resource", () => {
    const p = principal([
      { resource: "workflow", actions: ["admin"] },
    ]);
    assert.equal(
      checker.has({
        principal: p,
        resource: "workflow",
        action: "execute",
      }),
      true,
    );
  });
});

describe("ApprovalGate", () => {
  it("requires evidence to propose", () => {
    const gate = new ApprovalGate();
    const p = principal([]);
    const result = gate.propose({
      actionKind: "send",
      proposedBy: p,
      summary: "Send outreach",
      evidence: [],
      rationale: "growth",
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, "EVIDENCE_REQUIRED");
  });

  it("requireApproved refuses without approval id", () => {
    const gate = new ApprovalGate();
    const result = gate.requireApproved(undefined, "alter_production");
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, "APPROVAL_REQUIRED");
  });

  it("requireApproved refuses pending approval", () => {
    const gate = new ApprovalGate();
    const agent = principal([]);
    const proposed = gate.propose({
      actionKind: "alter_production",
      proposedBy: agent,
      summary: "Change workflow",
      evidence: ["ticket_1"],
      rationale: "ops request",
    });
    assert.equal(proposed.ok, true);
    if (!proposed.ok) return;

    const check = gate.requireApproved(proposed.value.id, "alter_production");
    assert.equal(check.ok, false);
    if (!check.ok) assert.equal(check.error.code, "APPROVAL_REQUIRED");
  });

  it("allows only after human approval", () => {
    const gate = new ApprovalGate();
    const agent = principal([]);
    const human = principal([{ resource: "system", actions: ["approve"] }], "human");

    const proposed = gate.propose({
      actionKind: "pay",
      proposedBy: agent,
      summary: "Pay invoice",
      evidence: ["invoice_99", "match_ok"],
      rationale: "matched exception queue",
    });
    assert.equal(proposed.ok, true);
    if (!proposed.ok) return;

    const decided = gate.decide(proposed.value.id, human, "approved", "ok");
    assert.equal(decided.ok, true);

    const check = gate.requireApproved(proposed.value.id, "pay");
    assert.equal(check.ok, true);
  });
});

describe("AuditLog", () => {
  it("is append-only and captures who/what/when/why/evidence", () => {
    const log = new AuditLog();
    const id = createId<PrincipalId>("prn");
    const event = log.append({
      principalId: id,
      principalKind: "agent",
      action: "tool.invoke",
      resource: "agent_tool",
      resourceId: "brain.get_summary",
      rationale: "diagnostic context",
      evidence: ["scope:entity:read"],
      outcome: "allowed",
    });
    assert.equal(log.list().length, 1);
    assert.equal(event.principalId, id);
    assert.ok(event.at);
    assert.deepEqual(event.evidence, ["scope:entity:read"]);
  });
});

describe("createGovernance", () => {
  it("wires production control surfaces", () => {
    const gov = createGovernance();
    assert.ok(gov.permissions);
    assert.ok(gov.approvals);
    assert.ok(gov.audit);
    assert.ok(gov.evaluations);
    assert.ok(gov.rollback);
    assert.ok(gov.incidents);
    const budget = gov.createBudget("agent-loop", {
      maxCostUsd: 1,
      maxLatencyMs: 5000,
    });
    budget.record({ costUsd: 0.1, latencyMs: 100 });
    assert.deepEqual(budget.check().exceeded, []);
  });
});
