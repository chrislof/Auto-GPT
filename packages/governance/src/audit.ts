import {
  createId,
  type AuditEventId,
  type PrincipalId,
} from "@mindpress/shared";

export interface AuditEvent {
  id: AuditEventId;
  at: string;
  /** Who */
  principalId: PrincipalId;
  principalKind: "human" | "agent" | "service";
  /** What */
  action: string;
  resource?: string;
  resourceId?: string;
  /** Why */
  rationale?: string;
  /** Evidence references (ids, hashes, URIs) — never raw secrets */
  evidence: string[];
  outcome: "allowed" | "denied" | "proposed" | "executed" | "failed" | "noted";
  details?: Record<string, unknown>;
}

export interface AppendAuditInput {
  principalId: PrincipalId;
  principalKind: "human" | "agent" | "service";
  action: string;
  resource?: string;
  resourceId?: string;
  rationale?: string;
  evidence?: string[];
  outcome: AuditEvent["outcome"];
  details?: Record<string, unknown>;
}

/**
 * Append-only in-memory audit log.
 * Records who / what / when / why / evidence for governed actions.
 */
export class AuditLog {
  private readonly events: AuditEvent[] = [];

  append(input: AppendAuditInput): AuditEvent {
    const event: AuditEvent = {
      id: createId<AuditEventId>("aud"),
      at: new Date().toISOString(),
      principalId: input.principalId,
      principalKind: input.principalKind,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId,
      rationale: input.rationale,
      evidence: input.evidence ? [...input.evidence] : [],
      outcome: input.outcome,
      details: input.details,
    };
    this.events.push(event);
    return event;
  }

  /** Returns a copy; the internal log is never mutated in place after append. */
  list(): readonly AuditEvent[] {
    return [...this.events];
  }

  find(predicate: (e: AuditEvent) => boolean): AuditEvent[] {
    return this.events.filter(predicate);
  }
}
