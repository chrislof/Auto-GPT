import {
  createId,
  err,
  ok,
  type ApprovalId,
  type Principal,
  type PrincipalId,
  type Result,
  MindPressError,
} from "@mindpress/shared";

/**
 * Consequential actions agents must not take unilaterally.
 * From manifesto: send, pay, publish, hire, fire, or alter production.
 */
export type ConsequentialActionKind =
  | "send"
  | "pay"
  | "publish"
  | "hire"
  | "fire"
  | "alter_production";

export type ApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "expired"
  | "cancelled";

export interface ApprovalRequest {
  id: ApprovalId;
  actionKind: ConsequentialActionKind;
  proposedBy: PrincipalId;
  summary: string;
  evidence: string[];
  rationale: string;
  payload: Record<string, unknown>;
  status: ApprovalStatus;
  createdAt: string;
  decidedAt?: string;
  decidedBy?: PrincipalId;
  decisionNote?: string;
}

export interface ProposeApprovalInput {
  actionKind: ConsequentialActionKind;
  proposedBy: Principal;
  summary: string;
  /** Facts or artifacts supporting the proposal — required for consequential work. */
  evidence: string[];
  rationale: string;
  payload?: Record<string, unknown>;
}

/**
 * Approval gate: agents propose; evidence + human/service authority allow.
 * No consequential action proceeds without an approved record.
 */
export class ApprovalGate {
  private readonly requests = new Map<ApprovalId, ApprovalRequest>();

  propose(input: ProposeApprovalInput): Result<ApprovalRequest, MindPressError> {
    if (input.evidence.length === 0) {
      return err(
        new MindPressError(
          "Consequential proposals require evidence",
          "EVIDENCE_REQUIRED",
          { actionKind: input.actionKind },
        ),
      );
    }

    const request: ApprovalRequest = {
      id: createId<ApprovalId>("apr"),
      actionKind: input.actionKind,
      proposedBy: input.proposedBy.id,
      summary: input.summary,
      evidence: [...input.evidence],
      rationale: input.rationale,
      payload: input.payload ?? {},
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    this.requests.set(request.id, request);
    return ok(request);
  }

  decide(
    approvalId: ApprovalId,
    decidedBy: Principal,
    decision: "approved" | "rejected",
    note?: string,
  ): Result<ApprovalRequest, MindPressError> {
    const existing = this.requests.get(approvalId);
    if (!existing) {
      return err(
        new MindPressError("Approval not found", "APPROVAL_NOT_FOUND", {
          approvalId,
        }),
      );
    }
    if (existing.status !== "pending") {
      return err(
        new MindPressError(
          `Approval already ${existing.status}`,
          "APPROVAL_NOT_PENDING",
          { approvalId, status: existing.status },
        ),
      );
    }

    const updated: ApprovalRequest = {
      ...existing,
      status: decision,
      decidedAt: new Date().toISOString(),
      decidedBy: decidedBy.id,
      decisionNote: note,
    };
    this.requests.set(approvalId, updated);
    return ok(updated);
  }

  get(approvalId: ApprovalId): Result<ApprovalRequest, MindPressError> {
    const existing = this.requests.get(approvalId);
    if (!existing) {
      return err(
        new MindPressError("Approval not found", "APPROVAL_NOT_FOUND", {
          approvalId,
        }),
      );
    }
    return ok(existing);
  }

  /**
   * Returns ok only when an approval exists, is approved, and matches the action kind.
   */
  requireApproved(
    approvalId: ApprovalId | undefined,
    actionKind: ConsequentialActionKind,
  ): Result<ApprovalRequest, MindPressError> {
    if (!approvalId) {
      return err(
        new MindPressError(
          `Action ${actionKind} requires an approved approval id`,
          "APPROVAL_REQUIRED",
          { actionKind },
        ),
      );
    }

    const found = this.get(approvalId);
    if (!found.ok) {
      return found;
    }

    if (found.value.actionKind !== actionKind) {
      return err(
        new MindPressError(
          "Approval action kind mismatch",
          "APPROVAL_KIND_MISMATCH",
          {
            expected: actionKind,
            actual: found.value.actionKind,
            approvalId,
          },
        ),
      );
    }

    if (found.value.status !== "approved") {
      return err(
        new MindPressError(
          `Approval is ${found.value.status}, not approved`,
          "APPROVAL_REQUIRED",
          { approvalId, status: found.value.status, actionKind },
        ),
      );
    }

    return ok(found.value);
  }

  list(filter?: { status?: ApprovalStatus; proposedBy?: PrincipalId }): ApprovalRequest[] {
    return [...this.requests.values()].filter((r) => {
      if (filter?.status && r.status !== filter.status) return false;
      if (filter?.proposedBy && r.proposedBy !== filter.proposedBy) return false;
      return true;
    });
  }
}
