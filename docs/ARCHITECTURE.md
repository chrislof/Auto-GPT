# MindPress Platform Architecture

> Strategic interpretation of the MindPress manifesto. This is the technical foundation we are building — not a claim of completed client delivery.

## Ambition

Every business should operate with the clarity, speed, and leverage of a great software company without having to become one first.

**We put AI to work for you.**

## System layers

```
┌─────────────────────────────────────────────────────────────┐
│  Applications (dashboards, queues, portals, copilots)       │
├─────────────────────────────────────────────────────────────┤
│  Agents (bounded work via MCP tools + approval gates)       │
├─────────────────────────────────────────────────────────────┤
│  App Factory (schemas, pages, handlers, workflows)          │
├─────────────────────────────────────────────────────────────┤
│  Company Brain (entities, metrics, policies, freshness)     │
├─────────────────────────────────────────────────────────────┤
│  Governance (permissions, audit, evals, rollback)           │
├─────────────────────────────────────────────────────────────┤
│  Connectors (systems of record, events, warehouses)         │
└─────────────────────────────────────────────────────────────┘
```

## Packages

| Package | Role |
|---------|------|
| `apps/web` | Public MindPress site — brand, manifesto, how we work |
| `packages/brain` | Company brain: entity map, metrics, policies, freshness |
| `packages/app-factory` | App/table/page/handler contracts and runtime stubs |
| `packages/mcp-server` | Governed MCP tools for authorized agents |
| `packages/governance` | Permissions, approvals, audit, evals, rollback |
| `packages/shared` | Shared types, errors, IDs, result helpers |

## Non-negotiables (from manifesto)

1. Agents get minimum access required for the task.
2. Consequential actions require authority + controls + evidence.
3. Facts separated from assumptions; no invented customer outcomes.
4. Client owns process, data access, apps, metrics, runbooks, evals.
5. Do not move sensitive data into a model because it is convenient.
6. Do not automate broken processes without understanding failure modes.

## Engagement loop

1. **Diagnostic** — constraint, baseline, buildable contract
2. **Install** — integrations, apps, agents, evals, controls
3. **Operate** — quality, cost, adoption, outcomes, ownership

## Proof standard

Production requires permission boundaries, failure-path tests, evaluation cases, versioning, idempotency, human approval for consequential actions, cost/latency limits, monitoring, operator controls, rehearsed rollback, readback, and measured impact.
