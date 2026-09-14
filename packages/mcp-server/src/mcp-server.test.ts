import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createGovernance } from "@mindpress/governance";
import {
  createId,
  type Principal,
  type PrincipalId,
} from "@mindpress/shared";
import { MindPressMcpServer } from "./server.js";
import { createStubPorts } from "./stubs.js";

function agentWith(scopes: Principal["scopes"]): Principal {
  return {
    id: createId<PrincipalId>("prn"),
    kind: "agent",
    displayName: "Bounded Agent",
    scopes,
  };
}

function humanApprover(): Principal {
  return {
    id: createId<PrincipalId>("prn"),
    kind: "human",
    displayName: "Ops Owner",
    scopes: [{ resource: "system", actions: ["approve"] }],
  };
}

describe("MindPressMcpServer governance", () => {
  it("denies tool call when principal lacks permission", async () => {
    const governance = createGovernance();
    const agent = agentWith([
      // Can list apps, but not brain tools
      {
        resource: "agent_tool",
        resourceId: "apps.list",
        actions: ["execute"],
      },
    ]);

    const server = new MindPressMcpServer({
      governance,
      ports: createStubPorts(),
      principals: [agent],
    });

    const result = await server.callTool({
      name: "brain.get_summary",
      credential: { principalId: agent.id },
      arguments: {},
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, "PERMISSION_DENIED");
    }

    const denied = governance.audit
      .list()
      .filter((e) => e.outcome === "denied");
    assert.ok(denied.length >= 1);
  });

  it("requires approval for workflows.enqueue (alter_production)", async () => {
    const governance = createGovernance();
    const agent = agentWith([
      { resource: "workflow", actions: ["execute"] },
      {
        resource: "agent_tool",
        resourceId: "approvals.request",
        actions: ["execute"],
      },
      {
        resource: "agent_tool",
        resourceId: "approvals.status",
        actions: ["execute"],
      },
    ]);
    const human = humanApprover();

    const server = new MindPressMcpServer({
      governance,
      ports: createStubPorts(),
      principals: [agent, human],
    });

    const withoutApproval = await server.callTool({
      name: "workflows.enqueue",
      credential: { principalId: agent.id },
      arguments: {
        workflowId: "margin_fix",
        payload: { exceptionId: "ex_1" },
      },
    });

    assert.equal(withoutApproval.ok, false);
    if (!withoutApproval.ok) {
      assert.equal(withoutApproval.error.code, "APPROVAL_REQUIRED");
    }

    const proposed = await server.callTool({
      name: "approvals.request",
      credential: { principalId: agent.id },
      arguments: {
        actionKind: "alter_production",
        summary: "Enqueue margin fix",
        rationale: "diagnostic contract signed",
        evidence: ["diag_42", "owner:ops"],
        payload: { workflowId: "margin_fix" },
      },
    });
    assert.equal(proposed.ok, true);
    if (!proposed.ok) return;

    const approvalId = (proposed.value as { id: string }).id;

    const stillPending = await server.callTool({
      name: "workflows.enqueue",
      credential: { principalId: agent.id },
      arguments: {
        workflowId: "margin_fix",
        approvalId,
      },
      approvalId: approvalId as never,
    });
    assert.equal(stillPending.ok, false);
    if (!stillPending.ok) {
      assert.equal(stillPending.error.code, "APPROVAL_REQUIRED");
    }

    const decided = governance.approvals.decide(
      approvalId as never,
      human,
      "approved",
      "proceed",
    );
    assert.equal(decided.ok, true);

    const allowed = await server.callTool({
      name: "workflows.enqueue",
      credential: { principalId: agent.id },
      arguments: {
        workflowId: "margin_fix",
        approvalId,
        payload: { exceptionId: "ex_1" },
      },
      approvalId: approvalId as never,
    });
    assert.equal(allowed.ok, true);
    if (allowed.ok) {
      assert.equal((allowed.value as { status: string }).status, "queued");
    }
  });

  it("allows scoped read tools when permitted", async () => {
    const governance = createGovernance();
    const agent = agentWith([
      {
        resource: "agent_tool",
        resourceId: "brain.get_summary",
        actions: ["execute"],
      },
    ]);
    const server = new MindPressMcpServer({
      governance,
      ports: createStubPorts(),
      principals: [agent],
    });

    const result = await server.callTool({
      name: "brain.get_summary",
      credential: { principalId: agent.id },
      arguments: { entityKinds: ["customer"] },
    });
    assert.equal(result.ok, true);
  });

  it("warehouse query requires permission and signed token", async () => {
    const governance = createGovernance();
    const agent = agentWith([
      { resource: "warehouse_query", actions: ["execute"] },
    ]);
    const server = new MindPressMcpServer({
      governance,
      ports: createStubPorts(),
      principals: [agent],
    });

    const badToken = await server.callTool({
      name: "warehouse.run_readonly_query",
      credential: { principalId: agent.id },
      arguments: { sql: "select 1", signedToken: "nope" },
    });
    assert.equal(badToken.ok, false);

    const okQuery = await server.callTool({
      name: "warehouse.run_readonly_query",
      credential: { principalId: agent.id },
      arguments: {
        sql: "select id, amount from t",
        signedToken: "valid-signed-token",
      },
    });
    assert.equal(okQuery.ok, true);
  });

  it("refuses unauthenticated calls", async () => {
    const governance = createGovernance();
    const server = new MindPressMcpServer({
      governance,
      ports: createStubPorts(),
      principals: [],
    });
    const result = await server.callTool({
      name: "apps.list",
      credential: { principalId: "missing" },
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, "UNAUTHENTICATED");
  });

  it("lists MCP-shaped tools", () => {
    const governance = createGovernance();
    const server = new MindPressMcpServer({
      governance,
      ports: createStubPorts(),
    });
    const { tools } = server.listTools();
    const names = tools.map((t) => t.name);
    assert.ok(names.includes("brain.get_summary"));
    assert.ok(names.includes("workflows.enqueue"));
    assert.ok(names.includes("approvals.request"));
  });
});
