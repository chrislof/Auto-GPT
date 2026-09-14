import type { AppId, PermissionScope } from "@mindpress/shared";
import { createId } from "@mindpress/shared";
import type { RollbackChecklistItem, RollbackPlan } from "./types.js";

const DEFAULT_CHECKLIST: ReadonlyArray<Omit<RollbackChecklistItem, "completed">> =
  [
    {
      id: "notify_owner",
      label: "Notify app owner and on-call operator",
      required: true,
    },
    {
      id: "freeze_writes",
      label: "Freeze mutable handlers and workflows",
      required: true,
    },
    {
      id: "restore_prior",
      label: "Restore prior app version / configuration",
      required: true,
    },
    {
      id: "verify_source",
      label: "Verify source-of-truth systems are consistent",
      required: true,
    },
    {
      id: "readback",
      label: "Perform readback that intended state is restored",
      required: true,
    },
    {
      id: "record_incident",
      label: "Record incident evidence and decision log",
      required: true,
    },
    {
      id: "notify_users",
      label: "Notify affected users if externally visible",
      required: false,
    },
  ];

export interface CreateRollbackPlanInput {
  appId: AppId;
  summary: string;
  steps: string[];
  affectedSystems: string[];
  authorizationScopes: PermissionScope[];
  id?: string;
}

/** Create a rollback plan with the standard rehearsal checklist. */
export function createRollbackPlan(
  input: CreateRollbackPlanInput,
): RollbackPlan {
  if (!input.summary.trim()) {
    throw new Error("RollbackPlan.summary is required");
  }
  if (input.steps.length === 0) {
    throw new Error("RollbackPlan.steps must include at least one step");
  }

  return {
    id: input.id ?? createId<string>("rbp"),
    appId: input.appId,
    summary: input.summary.trim(),
    steps: [...input.steps],
    affectedSystems: [...input.affectedSystems],
    authorizationScopes: [...input.authorizationScopes],
    checklist: DEFAULT_CHECKLIST.map((item) => ({
      ...item,
      completed: false,
    })),
  };
}

/**
 * Mark checklist items complete and optionally stamp a rehearsal time.
 * Returns a new plan; does not mutate the input.
 */
export function markRehearsalProgress(
  plan: RollbackPlan,
  completedItemIds: string[],
  options?: { rehearsedAt?: string; stampRehearsal?: boolean },
): RollbackPlan {
  const completed = new Set(completedItemIds);
  const checklist = plan.checklist.map((item) =>
    completed.has(item.id) ? { ...item, completed: true } : { ...item },
  );

  const requiredDone = checklist
    .filter((item) => item.required)
    .every((item) => item.completed);

  const stamp =
    options?.stampRehearsal === true ||
    (options?.rehearsedAt !== undefined && requiredDone);

  return {
    ...plan,
    checklist,
    lastRehearsedAt: stamp
      ? (options?.rehearsedAt ?? new Date().toISOString())
      : plan.lastRehearsedAt,
  };
}

/** True when every required checklist item is completed. */
export function isRollbackRehearsalComplete(plan: RollbackPlan): boolean {
  return plan.checklist
    .filter((item) => item.required)
    .every((item) => item.completed);
}

/** Human-readable rehearsal status for operators. */
export function formatRehearsalChecklist(plan: RollbackPlan): string {
  const lines = plan.checklist.map((item) => {
    const mark = item.completed ? "[x]" : "[ ]";
    const req = item.required ? "required" : "optional";
    return `${mark} ${item.label} (${req})`;
  });
  const status = isRollbackRehearsalComplete(plan)
    ? "REHEARSAL COMPLETE"
    : "REHEARSAL INCOMPLETE";
  const when = plan.lastRehearsedAt
    ? ` lastRehearsedAt=${plan.lastRehearsedAt}`
    : "";
  return [`Rollback rehearsal: ${status}${when}`, ...lines].join("\n");
}
