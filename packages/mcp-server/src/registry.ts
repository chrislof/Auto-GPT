import type { Result } from "@mindpress/shared";
import type { MindPressError } from "@mindpress/shared";
import type { Principal } from "@mindpress/shared";

/**
 * MCP-compatible tool shapes (stdlib-style registry; no SDK required).
 * Mirrors common MCP tool list/call contracts.
 */

export interface ToolJsonSchema {
  type: "object";
  properties?: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: ToolJsonSchema;
  /**
   * When set, invocation requires an approved ApprovalGate record of this kind
   * (or the tool may create a proposal and refuse execution).
   */
  consequential?:
    | "send"
    | "pay"
    | "publish"
    | "hire"
    | "fire"
    | "alter_production";
  /** Permission required to invoke. */
  permission: {
    resource:
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
    resourceId?: string;
    action: "read" | "write" | "execute" | "approve" | "admin";
  };
}

export interface ToolCallContext {
  principal: Principal;
  /** Optional approval id for consequential tools. */
  approvalId?: string;
  /** Request correlation for audit. */
  requestId?: string;
}

export type ToolHandler = (
  args: Record<string, unknown>,
  ctx: ToolCallContext,
) => Promise<Result<unknown, MindPressError>>;

export interface RegisteredTool {
  definition: McpToolDefinition;
  handler: ToolHandler;
}

export interface McpToolListItem {
  name: string;
  description: string;
  inputSchema: ToolJsonSchema;
}

export class ToolRegistry {
  private readonly tools = new Map<string, RegisteredTool>();

  register(definition: McpToolDefinition, handler: ToolHandler): void {
    if (this.tools.has(definition.name)) {
      throw new Error(`Tool already registered: ${definition.name}`);
    }
    this.tools.set(definition.name, { definition, handler });
  }

  get(name: string): RegisteredTool | undefined {
    return this.tools.get(name);
  }

  list(): McpToolListItem[] {
    return [...this.tools.values()].map((t) => ({
      name: t.definition.name,
      description: t.definition.description,
      inputSchema: t.definition.inputSchema,
    }));
  }

  names(): string[] {
    return [...this.tools.keys()];
  }
}
