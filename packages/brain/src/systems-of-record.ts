import { createId, err, ok, type Result } from "@mindpress/shared";
import type { AuthMode, SystemId, SystemOfRecord } from "./types.ts";

export interface RegisterSystemInput {
  name: string;
  description?: string;
  owner: string;
  authMode: AuthMode;
  freshnessSlaMinutes: number;
  sensitivity?: SystemOfRecord["sensitivity"];
  tags?: string[];
}

export interface SystemRegistry {
  register(input: RegisterSystemInput): Result<SystemOfRecord>;
  get(id: SystemId): SystemOfRecord | undefined;
  list(): SystemOfRecord[];
  findByName(name: string): SystemOfRecord | undefined;
}

export function createSystemRegistry(
  seed: SystemOfRecord[] = [],
): SystemRegistry {
  const byId = new Map<SystemId, SystemOfRecord>();
  for (const s of seed) byId.set(s.id, s);

  return {
    register(input) {
      if (!input.name.trim()) {
        return err(new Error("System name is required"));
      }
      if (!input.owner.trim()) {
        return err(new Error("System owner is required"));
      }
      if (input.freshnessSlaMinutes < 0) {
        return err(new Error("freshnessSlaMinutes must be >= 0"));
      }
      const existing = [...byId.values()].find(
        (s) => s.name.toLowerCase() === input.name.trim().toLowerCase(),
      );
      if (existing) {
        return err(new Error(`System already registered: ${input.name}`));
      }

      const record: SystemOfRecord = {
        id: createId<SystemId>("sys"),
        name: input.name.trim(),
        description: input.description?.trim() ?? "",
        owner: input.owner.trim(),
        authMode: input.authMode,
        freshnessSlaMinutes: input.freshnessSlaMinutes,
        sensitivity: input.sensitivity ?? "internal",
        tags: input.tags ?? [],
      };
      byId.set(record.id, record);
      return ok(record);
    },

    get(id) {
      return byId.get(id);
    },

    list() {
      return [...byId.values()];
    },

    findByName(name) {
      const key = name.trim().toLowerCase();
      return [...byId.values()].find((s) => s.name.toLowerCase() === key);
    },
  };
}
