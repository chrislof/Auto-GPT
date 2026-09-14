import { createId, err, ok, type Result } from "@mindpress/shared";
import type { ApprovalAction, PolicyDocument, PolicyId } from "./types.ts";

export interface RegisterPolicyInput {
  title: string;
  summary: string;
  owner: string;
  version?: string;
  requiredApprovals?: ApprovalAction[];
  blockedWithoutApproval?: ApprovalAction[];
  sensitivity?: PolicyDocument["sensitivity"];
}

export interface PolicyRegistry {
  register(input: RegisterPolicyInput): Result<PolicyDocument>;
  get(id: PolicyId): PolicyDocument | undefined;
  list(): PolicyDocument[];
  /** Policies that require a given approval action. */
  requiring(action: ApprovalAction): PolicyDocument[];
}

export function createPolicyRegistry(
  seed: PolicyDocument[] = [],
): PolicyRegistry {
  const byId = new Map<PolicyId, PolicyDocument>();
  for (const p of seed) byId.set(p.id, p);

  return {
    register(input) {
      if (!input.title.trim()) {
        return err(new Error("Policy title is required"));
      }
      if (!input.summary.trim()) {
        return err(new Error("Policy summary is required"));
      }
      if (!input.owner.trim()) {
        return err(new Error("Policy owner is required"));
      }

      const required = input.requiredApprovals ?? [];
      const blocked =
        input.blockedWithoutApproval ??
        (["pay", "hire", "terminate", "alter_production", "send_external"] as ApprovalAction[]);

      const policy: PolicyDocument = {
        id: createId<PolicyId>("pol"),
        title: input.title.trim(),
        summary: input.summary.trim(),
        owner: input.owner.trim(),
        version: input.version?.trim() || "0.1.0",
        requiredApprovals: required,
        blockedWithoutApproval: blocked,
        sensitivity: input.sensitivity ?? "internal",
      };
      byId.set(policy.id, policy);
      return ok(policy);
    },

    get(id) {
      return byId.get(id);
    },

    list() {
      return [...byId.values()];
    },

    requiring(action) {
      return [...byId.values()].filter(
        (p) =>
          p.requiredApprovals.includes(action) ||
          p.blockedWithoutApproval.includes(action),
      );
    },
  };
}
