# @mindpress/mcp-server

Governed MCP tool surface for authorized MindPress agents.

Agents get the **minimum access** required for the task. Consequential actions require **authority + evidence + approval**. Every invocation authenticates, checks permission, gates consequential tools, audits, and returns a structured `Result`.

## Tools

| Tool | Notes |
|------|--------|
| `brain.get_summary` | Scoped brain summary via `BrainPort` |
| `brain.list_entities` | Entity list via `BrainPort` |
| `apps.list` / `apps.get_context` | App factory via `AppFactoryPort` |
| `warehouse.run_readonly_query` | Signed token + `warehouse_query` permission; mutation SQL refused |
| `workflows.enqueue` | **Consequential** (`alter_production`) — requires approved approval |
| `approvals.request` / `approvals.status` | Propose / inspect consequential approvals |
| `audit.append_note` | Non-sensitive notes only |

## Governance pipeline

Every `callTool`:

1. **Authenticate** principal (`Authenticator`)
2. **Check permission** (`PermissionChecker` on tool scope)
3. **Approval gate** if `consequential` is set (`ApprovalGate.requireApproved`)
4. **Audit** allow / deny / execute / fail
5. Return `Result<T, MindPressError>`

## Ports

Brain and app-factory packages may be unfinished. Inject narrow adapters:

```ts
import { createGovernance } from "@mindpress/governance";
import { MindPressMcpServer, createStubPorts } from "@mindpress/mcp-server";

const governance = createGovernance();
const server = new MindPressMcpServer({
  governance,
  ports: createStubPorts(), // replace with real adapters
  principals: [agentPrincipal],
});

const listed = server.listTools();
const result = await server.callTool({
  name: "brain.get_summary",
  credential: { principalId: agentPrincipal.id },
  arguments: {},
});
```

## Design notes

- Stdlib-style `ToolRegistry` mirrors MCP tool list/call shapes without requiring the full MCP SDK.
- Does not move sensitive data into models; warehouse access is read-only and token-gated.
- Agents propose via `approvals.request`; they do not unilaterally send, pay, publish, hire, fire, or alter production.
