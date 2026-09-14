import type {
  ApprovalGate,
  AuditLog,
  ConsequentialActionKind,
  PermissionChecker,
} from "@mindpress/governance";
import {
  err,
  ok,
  type ApprovalId,
  type Principal,
  type Result,
  MindPressError,
} from "@mindpress/shared";
import type { McpToolDefinition, ToolCallContext, ToolHandler } from "./registry.js";

export interface GovernanceDeps {
  permissions: PermissionChecker;
  approvals: ApprovalGate;
  audit: AuditLog;
}

export interface GovernedInvokeInput {
  tool: McpToolDefinition;
  handler: ToolHandler;
  args: Record<string, unknown>;
  principal: Principal;
  approvalId?: ApprovalId;
  requestId?: string;
}

/**
 * Every tool invocation:
 * 1. Authenticate principal (caller supplies authenticated Principal)
 * 2. Check permission
 * 3. For consequential tools, require approval or refuse
 * 4. Write audit event
 * 5. Return structured Result
 */
export async function invokeGoverned(
  deps: GovernanceDeps,
  input: GovernedInvokeInput,
): Promise<Result<unknown, MindPressError>> {
  const { tool, handler, args, principal } = input;
  const resourceId = tool.permission.resourceId ?? tool.name;

  const perm = deps.permissions.check({
    principal,
    resource: tool.permission.resource,
    resourceId: tool.permission.resourceId ?? tool.name,
    action: tool.permission.action,
  });

  if (!perm.ok) {
    deps.audit.append({
      principalId: principal.id,
      principalKind: principal.kind,
      action: `tool.${tool.name}`,
      resource: tool.permission.resource,
      resourceId,
      rationale: "permission check failed",
      evidence: [],
      outcome: "denied",
      details: { code: perm.error.code, requestId: input.requestId },
    });
    return perm;
  }

  if (tool.consequential) {
    const actionKind = tool.consequential as ConsequentialActionKind;
    const approvalId =
      input.approvalId ??
      (typeof args["approvalId"] === "string"
        ? (args["approvalId"] as ApprovalId)
        : undefined);

    const approved = deps.approvals.requireApproved(approvalId, actionKind);
    if (!approved.ok) {
      deps.audit.append({
        principalId: principal.id,
        principalKind: principal.kind,
        action: `tool.${tool.name}`,
        resource: tool.permission.resource,
        resourceId,
        rationale: "consequential action without approval",
        evidence: [],
        outcome: "denied",
        details: {
          code: approved.error.code,
          actionKind,
          requestId: input.requestId,
        },
      });
      return approved;
    }
  }

  const ctx: ToolCallContext = {
    principal,
    approvalId: input.approvalId,
    requestId: input.requestId,
  };

  try {
    const result = await handler(args, ctx);
    deps.audit.append({
      principalId: principal.id,
      principalKind: principal.kind,
      action: `tool.${tool.name}`,
      resource: tool.permission.resource,
      resourceId,
      rationale: typeof args["rationale"] === "string" ? args["rationale"] : undefined,
      evidence: Array.isArray(args["evidence"])
        ? args["evidence"].filter((e): e is string => typeof e === "string")
        : [],
      outcome: result.ok ? "executed" : "failed",
      details: {
        requestId: input.requestId,
        ...(result.ok ? {} : { code: result.error.code }),
      },
    });
    return result;
  } catch (cause) {
    const error =
      cause instanceof MindPressError
        ? cause
        : new MindPressError(
            cause instanceof Error ? cause.message : "Tool failed",
            "TOOL_FAILED",
            { tool: tool.name },
          );
    deps.audit.append({
      principalId: principal.id,
      principalKind: principal.kind,
      action: `tool.${tool.name}`,
      resource: tool.permission.resource,
      resourceId,
      outcome: "failed",
      evidence: [],
      details: { requestId: input.requestId, code: error.code },
    });
    return err(error);
  }
}

export function denyUnauthenticated(
  deps: GovernanceDeps,
  toolName: string,
  authError: MindPressError,
): Result<never, MindPressError> {
  // No principal — audit with a sentinel service note is avoided to not invent identity.
  // Host may log separately; return structured error.
  void deps;
  void toolName;
  return err(authError);
}

export { ok, err };
