import { createId, err, ok, type EntityId, type Result } from "@mindpress/shared";
import type { CatalogEntity, EntityKind, SystemId } from "./types.ts";

export interface RegisterEntityInput {
  kind: EntityKind;
  displayName: string;
  owner: string;
  systemId?: SystemId;
  attributes?: CatalogEntity["attributes"];
  agentVisible?: boolean;
}

export interface EntityCatalog {
  register(input: RegisterEntityInput): Result<CatalogEntity>;
  get(id: EntityId): CatalogEntity | undefined;
  list(kind?: EntityKind): CatalogEntity[];
  listAgentVisible(kinds?: EntityKind[]): CatalogEntity[];
}

export function createEntityCatalog(
  seed: CatalogEntity[] = [],
): EntityCatalog {
  const byId = new Map<EntityId, CatalogEntity>();
  for (const e of seed) byId.set(e.id, e);

  return {
    register(input) {
      if (!input.displayName.trim()) {
        return err(new Error("Entity displayName is required"));
      }
      if (!input.owner.trim()) {
        return err(new Error("Entity owner is required"));
      }

      const entity: CatalogEntity = {
        id: createId<EntityId>("ent"),
        kind: input.kind,
        displayName: input.displayName.trim(),
        owner: input.owner.trim(),
        systemId: input.systemId,
        attributes: input.attributes ?? {},
        agentVisible: input.agentVisible ?? false,
      };
      byId.set(entity.id, entity);
      return ok(entity);
    },

    get(id) {
      return byId.get(id);
    },

    list(kind) {
      const all = [...byId.values()];
      return kind ? all.filter((e) => e.kind === kind) : all;
    },

    listAgentVisible(kinds) {
      return [...byId.values()].filter((e) => {
        if (!e.agentVisible) return false;
        if (!kinds || kinds.length === 0) return false;
        return kinds.includes(e.kind);
      });
    },
  };
}
