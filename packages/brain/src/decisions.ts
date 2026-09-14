import {
  createId,
  err,
  ok,
  type FactOrAssumption,
  type Result,
} from "@mindpress/shared";
import type { DecisionId, DecisionRecord } from "./types.ts";

export interface RegisterDecisionInput {
  title: string;
  summary: string;
  owner: string;
  decidedAt?: string;
  evidenceLinks?: Array<{
    label: string;
    ref: string;
    evidence: FactOrAssumption;
  }>;
  status?: DecisionRecord["status"];
}

export interface DecisionLog {
  register(input: RegisterDecisionInput): Result<DecisionRecord>;
  get(id: DecisionId): DecisionRecord | undefined;
  list(status?: DecisionRecord["status"]): DecisionRecord[];
  /** Facts only — assumptions are excluded from this view. */
  listWithFactsOnly(): DecisionRecord[];
}

export function createDecisionLog(
  seed: DecisionRecord[] = [],
): DecisionLog {
  const byId = new Map<DecisionId, DecisionRecord>();
  for (const d of seed) byId.set(d.id, d);

  return {
    register(input) {
      if (!input.title.trim()) {
        return err(new Error("Decision title is required"));
      }
      if (!input.summary.trim()) {
        return err(new Error("Decision summary is required"));
      }
      if (!input.owner.trim()) {
        return err(new Error("Decision owner is required"));
      }

      const links = input.evidenceLinks ?? [];
      for (const link of links) {
        if (link.evidence.kind === "assumption" && !link.evidence.needsTest.trim()) {
          return err(
            new Error(
              `Assumption evidence "${link.label}" must declare needsTest`,
            ),
          );
        }
      }

      const record: DecisionRecord = {
        id: createId<DecisionId>("dec"),
        title: input.title.trim(),
        summary: input.summary.trim(),
        owner: input.owner.trim(),
        decidedAt: input.decidedAt ?? new Date().toISOString(),
        evidenceLinks: links,
        status: input.status ?? "proposed",
      };
      byId.set(record.id, record);
      return ok(record);
    },

    get(id) {
      return byId.get(id);
    },

    list(status) {
      const all = [...byId.values()];
      return status ? all.filter((d) => d.status === status) : all;
    },

    listWithFactsOnly() {
      return [...byId.values()]
        .map((d) => ({
          ...d,
          evidenceLinks: d.evidenceLinks.filter(
            (l) => l.evidence.kind === "fact",
          ),
        }))
        .filter((d) => d.evidenceLinks.length > 0);
    },
  };
}
