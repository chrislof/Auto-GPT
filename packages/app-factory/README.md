# `@mindpress/app-factory`

Company app factory contracts for MindPress operating applications.

Inspired by verified Zollege Apps architecture lessons — **not** a copy of proprietary code. MindPress invents clean contracts for apps that employees can understand and control.

## What this package models

| Capability | Contract |
|---|---|
| Apps (internal / external) | `App`, `AppRegistry` |
| Flexible data tables | `TableDefinition` + schema validation |
| Pages | `PageDefinition` |
| Isolated server handlers | `HandlerDefinition` + `HandlerRuntime` stub |
| Private files + short-lived URLs | `FileStorage` / `InMemoryFileStorage` |
| Workflows / queues | `WorkflowDefinition` |
| Governed warehouse SQL | `WarehouseQuery` + `WarehouseQueryService` stub |
| Rollback | `RollbackPlan` + rehearsal checklist helpers |

Every app **must** have: **owner**, **source of truth**, **access policy**, **measurable outcome**, and **rollback path**.

## Install (workspace)

```bash
npm install
```

Depends on `@mindpress/shared` (Result helpers, branded ids, `OutcomeMetric`, `PermissionScope`).

## Scripts

```bash
npm run typecheck -w @mindpress/app-factory
npm run test -w @mindpress/app-factory
```

## Quick start

```ts
import {
  AppRegistry,
  createRollbackPlan,
  HandlerRuntime,
  WarehouseQueryService,
} from "@mindpress/app-factory";
import { createId, type AppId, type PrincipalId } from "@mindpress/shared";

const rollback = createRollbackPlan({
  appId: createId<AppId>("app"),
  summary: "Restore prior config and freeze writes",
  steps: ["Freeze handlers", "Restore version", "Readback"],
  affectedSystems: ["app-registry"],
  authorizationScopes: [{ resource: "app", actions: ["admin"] }],
});

const registry = new AppRegistry();
const created = registry.create({
  name: "Exception Queue",
  description: "Finance exceptions needing judgment",
  status: "draft",
  visibility: "internal",
  owner: "controller@example.com",
  sourceOfTruth: { primary: "erp.gl" },
  accessPolicy: {
    visibility: "internal",
    adminScopes: [{ resource: "app", actions: ["admin"] }],
    userScopes: [{ resource: "app", actions: ["read", "write"] }],
  },
  outcome: {
    metric: {
      id: "exception_cycle_time",
      name: "Exception cycle time",
      definition: "Median hours from open to close",
      owner: "controller@example.com",
      unit: "hours",
      direction: "decrease",
    },
  },
  rollbackPlanId: rollback.id,
  tables: [],
  pages: [],
  handlers: [],
  workflows: [],
});
```

## Design notes

- **HandlerRuntime** documents an isolation boundary (process, credentials, network, time, data) but does not execute untrusted code.
- **WarehouseQueryService** requires a `SignedQueryToken` shape and rejects mutating SQL; no real database is connected.
- **FileStorage** keeps objects private and mints short-lived URLs only.
- Registry is in-memory for scaffolding; durable storage can implement the same create/update + completeness contract later.
