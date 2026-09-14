# `@mindpress/brain`

The company brain: a trustworthy **map** of how the company operates — not a data lake dump and not chatbot memory.

## What it models

| Module | Purpose |
|--------|---------|
| Systems of record | Registered systems, owners, auth mode, freshness SLAs |
| Entity catalog | People/roles, customers, products, locations, transactions |
| Metric definitions | Named metrics with definitions, owners, source fields |
| Workflow + exception map | Workflows, exception types, owners, escalation |
| Policy + approval boundaries | Policy docs and required approval actions |
| Source freshness / quality | Freshness checks and data-quality signals |
| Decision log | Decisions, owners, evidence (fact vs assumption) |

`BrainMap` assembles these registries and can export a **governed summary** for agents: minimum scoped access, sensitive fields redacted, facts separated from assumptions.

## Design constraints (from manifesto)

- Separate facts from assumptions (`FactOrAssumption` from `@mindpress/shared`).
- Agents get minimum access / scoped views — never a full raw dump.
- Do not invent customer outcomes; evidence links stay explicit.

## Usage

```ts
import { createBrainMap } from "@mindpress/brain";

const brain = createBrainMap();

brain.systems.register({
  name: "ERP",
  owner: "finance-ops",
  authMode: "service_account",
  freshnessSlaMinutes: 60,
});

const summary = brain.exportGovernedSummary({
  principalId: "agent_ops_1",
  include: ["systems", "metrics", "workflows"],
});
```

## Scripts

```bash
npm run typecheck -w @mindpress/brain
npm run test -w @mindpress/brain
```

Tests use Node's built-in test runner with `--experimental-transform-types` so workspace TypeScript sources (including `@mindpress/shared`) load without a separate build step.