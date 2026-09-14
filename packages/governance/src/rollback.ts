import { createId } from "@mindpress/shared";

export type RollbackRehearsalId = string & {
  readonly __brand: "RollbackRehearsalId";
};

export type RehearsalStatus =
  | "planned"
  | "rehearsed"
  | "failed"
  | "stale";

export interface RollbackRehearsal {
  id: RollbackRehearsalId;
  workflowOrApp: string;
  owner: string;
  steps: string[];
  status: RehearsalStatus;
  lastRehearsedAt?: string;
  notes?: string;
  createdAt: string;
}

/**
 * Registry of rehearsed rollback paths.
 * Production requires a rehearsed rollback (manifesto proof standard).
 */
export class RollbackRehearsalRegistry {
  private readonly items = new Map<RollbackRehearsalId, RollbackRehearsal>();

  register(input: {
    workflowOrApp: string;
    owner: string;
    steps: string[];
    notes?: string;
  }): RollbackRehearsal {
    const item: RollbackRehearsal = {
      id: createId<RollbackRehearsalId>("rollback"),
      workflowOrApp: input.workflowOrApp,
      owner: input.owner,
      steps: [...input.steps],
      status: "planned",
      notes: input.notes,
      createdAt: new Date().toISOString(),
    };
    this.items.set(item.id, item);
    return item;
  }

  markRehearsed(
    id: RollbackRehearsalId,
    result: "rehearsed" | "failed",
    notes?: string,
  ): RollbackRehearsal | undefined {
    const existing = this.items.get(id);
    if (!existing) return undefined;
    const updated: RollbackRehearsal = {
      ...existing,
      status: result,
      lastRehearsedAt: new Date().toISOString(),
      notes: notes ?? existing.notes,
    };
    this.items.set(id, updated);
    return updated;
  }

  get(id: RollbackRehearsalId): RollbackRehearsal | undefined {
    return this.items.get(id);
  }

  list(filter?: { status?: RehearsalStatus }): RollbackRehearsal[] {
    return [...this.items.values()].filter((i) =>
      filter?.status ? i.status === filter.status : true,
    );
  }

  /** True when a rehearsed (not failed/stale/planned-only) path exists. */
  hasRehearsedPath(workflowOrApp: string): boolean {
    return [...this.items.values()].some(
      (i) =>
        i.workflowOrApp === workflowOrApp && i.status === "rehearsed",
    );
  }
}
