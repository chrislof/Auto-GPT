import {
  createId,
  err,
  ok,
  type FactOrAssumption,
  type Result,
} from "@mindpress/shared";
import type {
  DataQualitySignal,
  FreshnessCheck,
  FreshnessCheckId,
  FreshnessStatus,
  QualitySignalKind,
  SystemId,
  SystemOfRecord,
} from "./types.ts";

export interface RecordFreshnessInput {
  systemId: SystemId;
  checkedAt?: string;
  observedLagMinutes: number;
  notes?: string;
}

export interface RecordQualityInput {
  systemId: SystemId;
  kind: QualitySignalKind;
  /** Pass null when not yet measured — never invent a score. */
  score: number | null;
  evidence: FactOrAssumption;
  observedAt?: string;
}

export interface FreshnessRegistry {
  recordCheck(
    input: RecordFreshnessInput,
    systems: { get(id: SystemId): SystemOfRecord | undefined },
  ): Result<FreshnessCheck>;
  recordQuality(
    input: RecordQualityInput,
    systems: { get(id: SystemId): SystemOfRecord | undefined },
  ): Result<DataQualitySignal>;
  listChecks(systemId?: SystemId): FreshnessCheck[];
  listQuality(systemId?: SystemId): DataQualitySignal[];
  latestForSystem(systemId: SystemId): FreshnessCheck | undefined;
}

function deriveStatus(
  observedLagMinutes: number,
  slaMinutes: number,
): FreshnessStatus {
  if (observedLagMinutes < 0) return "unknown";
  if (observedLagMinutes <= slaMinutes) return "fresh";
  if (observedLagMinutes <= slaMinutes * 2) return "stale";
  return "failing";
}

export function createFreshnessRegistry(seed?: {
  checks?: FreshnessCheck[];
  quality?: DataQualitySignal[];
}): FreshnessRegistry {
  const checks = new Map<FreshnessCheckId, FreshnessCheck>();
  const quality = new Map<string, DataQualitySignal>();

  for (const c of seed?.checks ?? []) checks.set(c.id, c);
  for (const q of seed?.quality ?? []) quality.set(q.id, q);

  return {
    recordCheck(input, systems) {
      const system = systems.get(input.systemId);
      if (!system) {
        return err(new Error(`Unknown system: ${input.systemId}`));
      }
      if (input.observedLagMinutes < 0) {
        return err(new Error("observedLagMinutes must be >= 0"));
      }

      const checkedAt = input.checkedAt ?? new Date().toISOString();
      const record: FreshnessCheck = {
        id: createId<FreshnessCheckId>("fresh"),
        systemId: input.systemId,
        checkedAt,
        observedLagMinutes: input.observedLagMinutes,
        status: deriveStatus(
          input.observedLagMinutes,
          system.freshnessSlaMinutes,
        ),
        notes: input.notes,
      };
      checks.set(record.id, record);
      return ok(record);
    },

    recordQuality(input, systems) {
      const system = systems.get(input.systemId);
      if (!system) {
        return err(new Error(`Unknown system: ${input.systemId}`));
      }
      if (
        input.score !== null &&
        (Number.isNaN(input.score) || input.score < 0 || input.score > 1)
      ) {
        return err(new Error("Quality score must be null or in [0, 1]"));
      }
      if (
        input.evidence.kind === "assumption" &&
        input.score !== null
      ) {
        return err(
          new Error(
            "Do not attach numeric quality scores to assumptions — measure first",
          ),
        );
      }

      const signal: DataQualitySignal = {
        id: createId("dq"),
        systemId: input.systemId,
        kind: input.kind,
        score: input.score,
        evidence: input.evidence,
        observedAt: input.observedAt ?? new Date().toISOString(),
      };
      quality.set(signal.id, signal);
      return ok(signal);
    },

    listChecks(systemId) {
      const all = [...checks.values()];
      return systemId
        ? all.filter((c) => c.systemId === systemId)
        : all;
    },

    listQuality(systemId) {
      const all = [...quality.values()];
      return systemId
        ? all.filter((q) => q.systemId === systemId)
        : all;
    },

    latestForSystem(systemId) {
      const scoped = [...checks.values()]
        .filter((c) => c.systemId === systemId)
        .sort((a, b) => b.checkedAt.localeCompare(a.checkedAt));
      return scoped[0];
    },
  };
}
