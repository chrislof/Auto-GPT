import {
  createId,
  err,
  ok,
  type FactOrAssumption,
  type Result,
} from "@mindpress/shared";
import type { MetricDefId, MetricDefinition, SystemId } from "./types.ts";

export interface RegisterMetricInput {
  name: string;
  definition: string;
  owner: string;
  unit: string;
  direction: MetricDefinition["direction"];
  sourceSystemId?: SystemId;
  sourceFields?: string[];
  evidence: FactOrAssumption;
}

export interface MetricCatalog {
  register(input: RegisterMetricInput): Result<MetricDefinition>;
  get(id: MetricDefId): MetricDefinition | undefined;
  list(): MetricDefinition[];
  findByName(name: string): MetricDefinition | undefined;
}

export function createMetricCatalog(
  seed: MetricDefinition[] = [],
): MetricCatalog {
  const byId = new Map<MetricDefId, MetricDefinition>();
  for (const m of seed) byId.set(m.id as MetricDefId, m);

  return {
    register(input) {
      if (!input.name.trim()) {
        return err(new Error("Metric name is required"));
      }
      if (!input.definition.trim()) {
        return err(new Error("Metric definition is required"));
      }
      if (!input.owner.trim()) {
        return err(new Error("Metric owner is required"));
      }
      if (input.evidence.kind === "assumption" && !input.evidence.needsTest.trim()) {
        return err(
          new Error("Assumption metrics must declare needsTest — do not invent outcomes"),
        );
      }

      const existing = [...byId.values()].find(
        (m) => m.name.toLowerCase() === input.name.trim().toLowerCase(),
      );
      if (existing) {
        return err(new Error(`Metric already registered: ${input.name}`));
      }

      const metric: MetricDefinition = {
        id: createId<MetricDefId>("metric"),
        name: input.name.trim(),
        definition: input.definition.trim(),
        owner: input.owner.trim(),
        unit: input.unit.trim() || "count",
        direction: input.direction,
        sourceSystemId: input.sourceSystemId,
        sourceFields: input.sourceFields ?? [],
        evidence: input.evidence,
      };
      byId.set(metric.id as MetricDefId, metric);
      return ok(metric);
    },

    get(id) {
      return byId.get(id);
    },

    list() {
      return [...byId.values()];
    },

    findByName(name) {
      const key = name.trim().toLowerCase();
      return [...byId.values()].find((m) => m.name.toLowerCase() === key);
    },
  };
}
