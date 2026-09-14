import type { AppId, PrincipalId, Result } from "@mindpress/shared";
import { MindPressError, createId, err, ok } from "@mindpress/shared";
import type { SignedQueryToken, WarehouseQuery } from "./types.js";

export interface WarehouseQueryRequest {
  query: WarehouseQuery;
  /** Signed, scoped token required for every execution. */
  token: SignedQueryToken;
}

export interface WarehouseQueryResult {
  queryId: string;
  columns: string[];
  /** Stub rows — no real database is connected. */
  rows: Record<string, unknown>[];
  truncated: boolean;
  executedAt: string;
}

function isMutatingSql(sql: string): boolean {
  const normalized = sql.replace(/\s+/g, " ").trim().toLowerCase();
  return /^(insert|update|delete|drop|alter|create|truncate|merge|grant|revoke)\b/.test(
    normalized,
  );
}

function tokenLooksSigned(token: SignedQueryToken): boolean {
  return (
    typeof token.signature === "string" &&
    token.signature.length >= 16 &&
    typeof token.expiresAt === "string" &&
    Array.isArray(token.warehouses) &&
    token.warehouses.length > 0 &&
    typeof token.maxRows === "number" &&
    token.maxRows > 0
  );
}

/**
 * Governed warehouse query service (stub).
 *
 * Apps never receive database passwords. They present a signed, scoped
 * query token. This stub validates token shape and read-only SQL intent
 * without connecting to a real warehouse.
 */
export class WarehouseQueryService {
  execute(
    request: WarehouseQueryRequest,
  ): Result<WarehouseQueryResult, MindPressError> {
    const { query, token } = request;

    if (!tokenLooksSigned(token)) {
      return err(
        new MindPressError(
          "Warehouse query requires a signed scoped token (signature, expiry, warehouses, maxRows)",
          "WAREHOUSE_TOKEN_INVALID",
          { queryId: query.id },
        ),
      );
    }

    if (token.queryId !== query.id || token.appId !== query.appId) {
      return err(
        new MindPressError(
          "Token scope does not match query",
          "WAREHOUSE_TOKEN_SCOPE_MISMATCH",
          { queryId: query.id, tokenQueryId: token.queryId },
        ),
      );
    }

    if (Date.parse(token.expiresAt) <= Date.now()) {
      return err(
        new MindPressError(
          "Signed query token has expired",
          "WAREHOUSE_TOKEN_EXPIRED",
          { expiresAt: token.expiresAt },
        ),
      );
    }

    if (!token.warehouses.includes(query.warehouse)) {
      return err(
        new MindPressError(
          "Token does not grant access to requested warehouse",
          "WAREHOUSE_NOT_ALLOWED",
          { warehouse: query.warehouse, allowed: token.warehouses },
        ),
      );
    }

    if (isMutatingSql(query.sql)) {
      return err(
        new MindPressError(
          "Warehouse layer is read-only; mutating SQL is rejected",
          "WAREHOUSE_MUTATION_REJECTED",
          { queryId: query.id },
        ),
      );
    }

    const effectiveMax = Math.min(query.maxRows, token.maxRows);
    if (effectiveMax <= 0) {
      return err(
        new MindPressError("maxRows must be positive", "WAREHOUSE_INVALID"),
      );
    }

    // Stub: no real SQL execution. Return an empty governed result set.
    return ok({
      queryId: query.id,
      columns: [],
      rows: [],
      truncated: false,
      executedAt: new Date().toISOString(),
    });
  }

  /** Helper to build a query record with a generated id. */
  createQuery(input: {
    appId: AppId;
    warehouse: string;
    sql: string;
    maxRows: number;
    requestedBy: PrincipalId;
  }): WarehouseQuery {
    return {
      id: createId<string>("whq"),
      appId: input.appId,
      warehouse: input.warehouse,
      sql: input.sql,
      maxRows: input.maxRows,
      requestedBy: input.requestedBy,
      createdAt: new Date().toISOString(),
    };
  }
}
