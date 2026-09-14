import { ApprovalGate } from "./approvals.js";
import { AuditLog } from "./audit.js";
import { BudgetTracker, type BudgetLimits } from "./budgets.js";
import { EvaluationRegistry } from "./evals.js";
import { IncidentRegistry } from "./incidents.js";
import { PermissionChecker } from "./permissions.js";
import { RollbackRehearsalRegistry } from "./rollback.js";

export * from "./approvals.js";
export * from "./audit.js";
export * from "./budgets.js";
export * from "./evals.js";
export * from "./incidents.js";
export * from "./permissions.js";
export * from "./rollback.js";

/**
 * Production AI controls surface.
 * Agents propose; evidence + authority allow. Governance does not invent outcomes.
 */
export interface GovernanceServices {
  permissions: PermissionChecker;
  approvals: ApprovalGate;
  audit: AuditLog;
  evaluations: EvaluationRegistry;
  rollback: RollbackRehearsalRegistry;
  incidents: IncidentRegistry;
  createBudget(name: string, limits: BudgetLimits): BudgetTracker;
}

export function createGovernance(): GovernanceServices {
  return {
    permissions: new PermissionChecker(),
    approvals: new ApprovalGate(),
    audit: new AuditLog(),
    evaluations: new EvaluationRegistry(),
    rollback: new RollbackRehearsalRegistry(),
    incidents: new IncidentRegistry(),
    createBudget: (name, limits) => new BudgetTracker(name, limits),
  };
}
