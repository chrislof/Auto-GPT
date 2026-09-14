import type { GovernanceServices } from "@mindpress/governance";
import {
  err,
  type ApprovalId,
  type Principal,
  type Result,
  MindPressError,
} from "@mindpress/shared";
import {
  StaticPrincipalAuthenticator,
  type Authenticator,
} from "./auth.js";
import { invokeGoverned, type GovernanceDeps } from "./governed-invoke.js";
import type { MindPressPorts } from "./ports.js";
import { ToolRegistry } from "./registry.js";
import { registerMindPressTools } from "./tools.js";

export interface MindPressMcpServerOptions {
  governance: GovernanceServices;
  ports: MindPressPorts;
  authenticator?: Authenticator;
  /** Pre-registered principals for the default static authenticator. */
  principals?: Principal[];
}

export interface ToolCallRequest {
  name: string;
  arguments?: Record<string, unknown>;
  /** Credential resolved by Authenticator (e.g. { principalId }). */
  credential: unknown;
  approvalId?: ApprovalId;
  requestId?: string;
}

/**
 * Governed MCP-compatible tool server for authorized agents.
 */
export class MindPressMcpServer {
  readonly registry = new ToolRegistry();
  private readonly auth: Authenticator;
  private readonly govDeps: GovernanceDeps;

  constructor(options: MindPressMcpServerOptions) {
    this.govDeps = {
      permissions: options.governance.permissions,
      approvals: options.governance.approvals,
      audit: options.governance.audit,
    };

    if (options.authenticator) {
      this.auth = options.authenticator;
    } else {
      const map = new Map(
        (options.principals ?? []).map((p) => [p.id, p] as const),
      );
      this.auth = new StaticPrincipalAuthenticator(map);
    }

    registerMindPressTools(
      this.registry,
      options.ports,
      options.governance.approvals,
      options.governance.audit,
    );
  }

  /** MCP tools/list shape. */
  listTools() {
    return { tools: this.registry.list() };
  }

  /** MCP tools/call with full governance pipeline. */
  async callTool(
    request: ToolCallRequest,
  ): Promise<Result<unknown, MindPressError>> {
    const auth = this.auth.authenticate(request.credential);
    if (!auth.ok) {
      return err(auth.error);
    }

    const registered = this.registry.get(request.name);
    if (!registered) {
      return err(
        new MindPressError(`Unknown tool: ${request.name}`, "TOOL_NOT_FOUND", {
          name: request.name,
        }),
      );
    }

    return invokeGoverned(this.govDeps, {
      tool: registered.definition,
      handler: registered.handler,
      args: request.arguments ?? {},
      principal: auth.value,
      approvalId: request.approvalId,
      requestId: request.requestId,
    });
  }
}
