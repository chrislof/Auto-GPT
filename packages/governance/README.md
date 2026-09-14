# @mindpress/governance

Production AI controls for MindPress.

Agents **propose**. Evidence + authority **allow**. This package never invents customer outcomes or bypasses permission boundaries.

## Capabilities

| Module | Role |
|--------|------|
| `PermissionChecker` | Minimum-access checks against `Principal` + `PermissionScope` from `@mindpress/shared` |
| `ApprovalGate` | Gate for consequential actions: send, pay, publish, hire, fire, alter production |
| `AuditLog` | Append-only who / what / when / why / evidence |
| `EvaluationRegistry` | Cases, expected behaviors, pass/fail runs |
| `BudgetTracker` | Cost / latency / token budget stubs |
| `RollbackRehearsalRegistry` | Rehearsed rollback paths |
| `IncidentRegistry` | Named incident ownership |

## Separation of duties

1. An agent may **propose** a consequential action with evidence and rationale.
2. An authorized principal **approves** or **rejects**.
3. Execution paths call `requireApproved` — pending or missing approvals refuse.
4. Every decision path should append an audit event.

## Usage

```ts
import { createGovernance } from "@mindpress/governance";
import type { Principal } from "@mindpress/shared";

const gov = createGovernance();

const check = gov.permissions.check({
  principal,
  resource: "agent_tool",
  resourceId: "workflows.enqueue",
  action: "execute",
});

if (!check.ok) {
  // refuse — do not proceed
}

const proposal = gov.approvals.propose({
  actionKind: "alter_production",
  proposedBy: principal,
  summary: "Enqueue margin-exception workflow",
  evidence: ["diag_report_42", "owner:financeops"],
  rationale: "Operator approved diagnostic contract",
});
```

## Proof alignment

Matches manifesto production requirements: permission boundaries, human approval for consequential actions, evaluation sets, cost/latency limits, incident ownership, rehearsed rollback, and audit evidence.
