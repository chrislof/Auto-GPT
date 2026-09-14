import { createId } from "@mindpress/shared";

export type IncidentId = string & { readonly __brand: "IncidentId" };

export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type IncidentStatus =
  | "open"
  | "investigating"
  | "mitigated"
  | "resolved"
  | "postmortem";

export interface IncidentOwnership {
  id: IncidentId;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  /** Named owner — production AI requires incident ownership. */
  owner: string;
  backupOwner?: string;
  relatedWorkflowOrApp?: string;
  openedAt: string;
  updatedAt: string;
  summary: string;
  evidence: string[];
}

/**
 * Incident ownership records — who owns quality/cost/latency failures in production.
 */
export class IncidentRegistry {
  private readonly incidents = new Map<IncidentId, IncidentOwnership>();

  open(input: {
    title: string;
    severity: IncidentSeverity;
    owner: string;
    backupOwner?: string;
    relatedWorkflowOrApp?: string;
    summary: string;
    evidence?: string[];
  }): IncidentOwnership {
    const now = new Date().toISOString();
    const incident: IncidentOwnership = {
      id: createId<IncidentId>("inc"),
      title: input.title,
      severity: input.severity,
      status: "open",
      owner: input.owner,
      backupOwner: input.backupOwner,
      relatedWorkflowOrApp: input.relatedWorkflowOrApp,
      openedAt: now,
      updatedAt: now,
      summary: input.summary,
      evidence: input.evidence ? [...input.evidence] : [],
    };
    this.incidents.set(incident.id, incident);
    return incident;
  }

  updateStatus(
    id: IncidentId,
    status: IncidentStatus,
    note?: string,
  ): IncidentOwnership | undefined {
    const existing = this.incidents.get(id);
    if (!existing) return undefined;
    const updated: IncidentOwnership = {
      ...existing,
      status,
      updatedAt: new Date().toISOString(),
      summary: note ? `${existing.summary}\n${note}` : existing.summary,
    };
    this.incidents.set(id, updated);
    return updated;
  }

  get(id: IncidentId): IncidentOwnership | undefined {
    return this.incidents.get(id);
  }

  list(filter?: { status?: IncidentStatus; owner?: string }): IncidentOwnership[] {
    return [...this.incidents.values()].filter((i) => {
      if (filter?.status && i.status !== filter.status) return false;
      if (filter?.owner && i.owner !== filter.owner) return false;
      return true;
    });
  }
}
