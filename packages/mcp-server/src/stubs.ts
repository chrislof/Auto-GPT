import type {
  AppFactoryPort,
  BrainPort,
  MindPressPorts,
  WarehousePort,
  WorkflowPort,
} from "./ports.js";
import { MindPressError } from "@mindpress/shared";

/** In-memory adapters for tests and local scaffolding. */
export function createStubPorts(overrides?: Partial<MindPressPorts>): MindPressPorts {
  const brain: BrainPort = {
    async getSummary(scope) {
      return {
        companyName: "Example Co",
        entityCount: 3,
        freshnessNote: "synthetic stub — not client data",
        highlights: scope?.entityKinds?.length
          ? [`scoped to ${scope.entityKinds.join(",")}`]
          : ["full map stub"],
      };
    },
    async listEntities(filter) {
      const all = [
        { id: "ent_1", kind: "customer", name: "Acme" },
        { id: "ent_2", kind: "product", name: "Widget" },
        { id: "ent_3", kind: "location", name: "HQ" },
      ];
      let rows = filter?.kind ? all.filter((e) => e.kind === filter.kind) : all;
      if (filter?.limit !== undefined) rows = rows.slice(0, filter.limit);
      return rows;
    },
  };

  const apps: AppFactoryPort = {
    async listApps() {
      return [
        {
          id: "app_margin",
          name: "Margin Exceptions",
          owner: "ops",
          job: "show where margin disappeared",
        },
      ];
    },
    async getContext(appId) {
      if (appId !== "app_margin") return undefined;
      return {
        id: appId,
        name: "Margin Exceptions",
        owner: "ops",
        job: "show where margin disappeared",
        tables: ["exceptions"],
        pages: ["queue"],
        accessPolicy: "role:ops read",
      };
    },
  };

  const warehouse: WarehousePort = {
    async runReadonlyQuery(input) {
      if (input.signedToken !== "valid-signed-token") {
        throw new MindPressError("Invalid signed token", "INVALID_TOKEN");
      }
      return {
        columns: ["id", "amount"],
        rows: [["1", 10]],
        rowCount: 1,
      };
    },
  };

  const workflows: WorkflowPort = {
    async enqueue(input) {
      return { jobId: `job_${input.workflowId}`, status: "queued" };
    },
  };

  return {
    brain: overrides?.brain ?? brain,
    apps: overrides?.apps ?? apps,
    warehouse: overrides?.warehouse ?? warehouse,
    workflows: overrides?.workflows ?? workflows,
  };
}
