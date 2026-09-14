import type { ApprovalGate, AuditLog } from "@mindpress/governance";
import {
  createId,
  err,
  ok,
  type ApprovalId,
  type Result,
  MindPressError,
} from "@mindpress/shared";
import type { MindPressPorts } from "./ports.js";
import type { ToolRegistry } from "./registry.js";

function asString(v: unknown, field: string): Result<string, MindPressError> {
  if (typeof v !== "string" || v.length === 0) {
    return err(
      new MindPressError(`Missing or invalid ${field}`, "INVALID_ARGS", {
        field,
      }),
    );
  }
  return ok(v);
}

export function registerMindPressTools(
  registry: ToolRegistry,
  ports: MindPressPorts,
  approvals: ApprovalGate,
  audit: AuditLog,
): void {
  registry.register(
    {
      name: "brain.get_summary",
      description:
        "Get a scoped company-brain summary (entities, freshness). Minimum access.",
      inputSchema: {
        type: "object",
        properties: {
          entityKinds: {
            type: "array",
            items: { type: "string" },
            description: "Optional entity kind filter",
          },
        },
      },
      permission: {
        resource: "agent_tool",
        resourceId: "brain.get_summary",
        action: "execute",
      },
    },
    async (args) => {
      const kinds = Array.isArray(args["entityKinds"])
        ? args["entityKinds"].filter((k): k is string => typeof k === "string")
        : undefined;
      const summary = await ports.brain.getSummary(
        kinds ? { entityKinds: kinds } : undefined,
      );
      return ok(summary);
    },
  );

  registry.register(
    {
      name: "brain.list_entities",
      description: "List brain entities with optional kind filter.",
      inputSchema: {
        type: "object",
        properties: {
          kind: { type: "string" },
          limit: { type: "number" },
        },
      },
      permission: {
        resource: "agent_tool",
        resourceId: "brain.list_entities",
        action: "execute",
      },
    },
    async (args) => {
      const entities = await ports.brain.listEntities({
        kind: typeof args["kind"] === "string" ? args["kind"] : undefined,
        limit: typeof args["limit"] === "number" ? args["limit"] : undefined,
      });
      return ok(entities);
    },
  );

  registry.register(
    {
      name: "apps.list",
      description: "List app-factory applications the principal may see.",
      inputSchema: { type: "object", properties: {} },
      permission: {
        resource: "agent_tool",
        resourceId: "apps.list",
        action: "execute",
      },
    },
    async () => ok(await ports.apps.listApps()),
  );

  registry.register(
    {
      name: "apps.get_context",
      description: "Get app context (tables, pages, access policy).",
      inputSchema: {
        type: "object",
        properties: { appId: { type: "string" } },
        required: ["appId"],
      },
      permission: {
        resource: "agent_tool",
        resourceId: "apps.get_context",
        action: "execute",
      },
    },
    async (args) => {
      const appId = asString(args["appId"], "appId");
      if (!appId.ok) return appId;
      const ctx = await ports.apps.getContext(appId.value);
      if (!ctx) {
        return err(
          new MindPressError("App not found", "NOT_FOUND", {
            appId: appId.value,
          }),
        );
      }
      return ok(ctx);
    },
  );

  registry.register(
    {
      name: "warehouse.run_readonly_query",
      description:
        "Run a governed read-only warehouse query. Requires signed token + permission.",
      inputSchema: {
        type: "object",
        properties: {
          sql: { type: "string" },
          signedToken: { type: "string" },
        },
        required: ["sql", "signedToken"],
      },
      permission: {
        resource: "warehouse_query",
        action: "execute",
      },
    },
    async (args) => {
      const sql = asString(args["sql"], "sql");
      if (!sql.ok) return sql;
      const signedToken = asString(args["signedToken"], "signedToken");
      if (!signedToken.ok) return signedToken;

      // Defense in depth: refuse obvious mutating SQL keywords before port call.
      if (/\b(insert|update|delete|drop|alter|truncate|create|grant)\b/i.test(sql.value)) {
        return err(
          new MindPressError(
            "Only read-only queries are permitted",
            "WAREHOUSE_MUTATION_REFUSED",
          ),
        );
      }

      try {
        const result = await ports.warehouse.runReadonlyQuery({
          sql: sql.value,
          signedToken: signedToken.value,
        });
        return ok(result);
      } catch (cause) {
        return err(
          cause instanceof MindPressError
            ? cause
            : new MindPressError(
                cause instanceof Error ? cause.message : "Query failed",
                "WAREHOUSE_QUERY_FAILED",
              ),
        );
      }
    },
  );

  registry.register(
    {
      name: "workflows.enqueue",
      description:
        "Enqueue a workflow that may alter production. Requires approved alter_production approval.",
      inputSchema: {
        type: "object",
        properties: {
          workflowId: { type: "string" },
          payload: { type: "object" },
          approvalId: { type: "string" },
          rationale: { type: "string" },
          evidence: { type: "array", items: { type: "string" } },
        },
        required: ["workflowId", "approvalId"],
      },
      consequential: "alter_production",
      permission: {
        resource: "workflow",
        action: "execute",
      },
    },
    async (args) => {
      const workflowId = asString(args["workflowId"], "workflowId");
      if (!workflowId.ok) return workflowId;
      const payload =
        typeof args["payload"] === "object" &&
        args["payload"] !== null &&
        !Array.isArray(args["payload"])
          ? (args["payload"] as Record<string, unknown>)
          : {};
      const result = await ports.workflows.enqueue({
        workflowId: workflowId.value,
        payload,
      });
      return ok(result);
    },
  );

  registry.register(
    {
      name: "approvals.request",
      description:
        "Propose a consequential action for human/service approval. Agents propose; authority allows.",
      inputSchema: {
        type: "object",
        properties: {
          actionKind: {
            type: "string",
            enum: ["send", "pay", "publish", "hire", "fire", "alter_production"],
          },
          summary: { type: "string" },
          rationale: { type: "string" },
          evidence: { type: "array", items: { type: "string" } },
          payload: { type: "object" },
        },
        required: ["actionKind", "summary", "rationale", "evidence"],
      },
      permission: {
        resource: "agent_tool",
        resourceId: "approvals.request",
        action: "execute",
      },
    },
    async (args, ctx) => {
      const actionKind = asString(args["actionKind"], "actionKind");
      if (!actionKind.ok) return actionKind;
      const summary = asString(args["summary"], "summary");
      if (!summary.ok) return summary;
      const rationale = asString(args["rationale"], "rationale");
      if (!rationale.ok) return rationale;
      const evidence = Array.isArray(args["evidence"])
        ? args["evidence"].filter((e): e is string => typeof e === "string")
        : [];

      const kind = actionKind.value as
        | "send"
        | "pay"
        | "publish"
        | "hire"
        | "fire"
        | "alter_production";

      const proposed = approvals.propose({
        actionKind: kind,
        proposedBy: ctx.principal,
        summary: summary.value,
        rationale: rationale.value,
        evidence,
        payload:
          typeof args["payload"] === "object" && args["payload"] !== null
            ? (args["payload"] as Record<string, unknown>)
            : {},
      });

      if (proposed.ok) {
        audit.append({
          principalId: ctx.principal.id,
          principalKind: ctx.principal.kind,
          action: "approvals.request",
          resource: "system",
          rationale: rationale.value,
          evidence,
          outcome: "proposed",
          details: { approvalId: proposed.value.id, actionKind: kind },
        });
      }

      return proposed;
    },
  );

  registry.register(
    {
      name: "approvals.status",
      description: "Get status of an approval request.",
      inputSchema: {
        type: "object",
        properties: { approvalId: { type: "string" } },
        required: ["approvalId"],
      },
      permission: {
        resource: "agent_tool",
        resourceId: "approvals.status",
        action: "execute",
      },
    },
    async (args) => {
      const approvalId = asString(args["approvalId"], "approvalId");
      if (!approvalId.ok) return approvalId;
      return approvals.get(approvalId.value as ApprovalId);
    },
  );

  registry.register(
    {
      name: "audit.append_note",
      description:
        "Append a non-sensitive operator/agent note to the audit log.",
      inputSchema: {
        type: "object",
        properties: {
          note: { type: "string" },
          rationale: { type: "string" },
          evidence: { type: "array", items: { type: "string" } },
        },
        required: ["note"],
      },
      permission: {
        resource: "agent_tool",
        resourceId: "audit.append_note",
        action: "execute",
      },
    },
    async (args, ctx) => {
      const note = asString(args["note"], "note");
      if (!note.ok) return note;

      // Refuse obvious secret-looking payloads in notes.
      if (/(password|secret|api[_-]?key|token\s*=)/i.test(note.value)) {
        return err(
          new MindPressError(
            "Sensitive content refused in audit notes",
            "SENSITIVE_NOTE_REFUSED",
          ),
        );
      }

      const evidence = Array.isArray(args["evidence"])
        ? args["evidence"].filter((e): e is string => typeof e === "string")
        : [];

      const event = audit.append({
        principalId: ctx.principal.id,
        principalKind: ctx.principal.kind,
        action: "audit.append_note",
        rationale:
          typeof args["rationale"] === "string" ? args["rationale"] : undefined,
        evidence,
        outcome: "noted",
        details: { note: note.value, correlationId: createId("note") },
      });
      return ok({ auditEventId: event.id, at: event.at });
    },
  );
}
