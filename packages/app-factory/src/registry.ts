import {
  type AppId,
  type Result,
  MindPressError,
  createId,
  err,
  ok,
} from "@mindpress/shared";
import { assertValidAppTables } from "./schema.js";
import type {
  App,
  CreateAppInput,
  UpdateAppInput,
} from "./types.js";

/** Missing completeness fields for a production-ready app. */
export type AppCompletenessGap =
  | "owner"
  | "sourceOfTruth"
  | "accessPolicy"
  | "outcome"
  | "rollbackPath";

export interface AppCompletenessReport {
  complete: boolean;
  gaps: AppCompletenessGap[];
}

/**
 * Manifesto rule: every app must have an owner, source of truth,
 * access policy, measurable outcome, and rollback path.
 */
export function assessAppCompleteness(app: App): AppCompletenessReport {
  const gaps: AppCompletenessGap[] = [];

  if (!app.owner?.trim()) {
    gaps.push("owner");
  }
  if (!app.sourceOfTruth?.primary?.trim()) {
    gaps.push("sourceOfTruth");
  }
  if (
    !app.accessPolicy ||
    !app.accessPolicy.adminScopes?.length ||
    !app.accessPolicy.userScopes?.length
  ) {
    gaps.push("accessPolicy");
  }
  if (!app.outcome?.metric?.id || !app.outcome.metric.name?.trim()) {
    gaps.push("outcome");
  }
  if (!app.rollbackPlanId?.trim()) {
    gaps.push("rollbackPath");
  }

  return { complete: gaps.length === 0, gaps };
}

export function assertAppComplete(app: App): void {
  const report = assessAppCompleteness(app);
  if (!report.complete) {
    throw new MindPressError(
      "App is missing required completeness fields",
      "APP_INCOMPLETE",
      { gaps: report.gaps, appId: app.id },
    );
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeCreateInput(input: CreateAppInput): App {
  const timestamp = nowIso();
  return {
    ...input,
    id: input.id ?? createId<AppId>("app"),
    tables: input.tables ?? [],
    pages: input.pages ?? [],
    handlers: input.handlers ?? [],
    workflows: input.workflows ?? [],
    createdAt: timestamp,
    updatedAt: timestamp,
    version: 1,
  };
}

/**
 * In-memory registry for company apps.
 * Production deployments would back this with durable storage;
 * the contract (create/update + completeness) stays the same.
 */
export class AppRegistry {
  private readonly apps = new Map<AppId, App>();

  create(input: CreateAppInput): Result<App, MindPressError> {
    try {
      const app = normalizeCreateInput(input);
      if (this.apps.has(app.id)) {
        return err(
          new MindPressError(
            `App already exists: ${app.id}`,
            "APP_ALREADY_EXISTS",
            { appId: app.id },
          ),
        );
      }

      assertValidAppTables(app.tables);
      assertAppComplete(app);

      this.apps.set(app.id, app);
      return ok(app);
    } catch (e) {
      return err(toMindPressError(e, "APP_CREATE_FAILED"));
    }
  }

  update(
    id: AppId,
    patch: UpdateAppInput,
  ): Result<App, MindPressError> {
    try {
      const existing = this.apps.get(id);
      if (!existing) {
        return err(
          new MindPressError(`App not found: ${id}`, "APP_NOT_FOUND", {
            appId: id,
          }),
        );
      }

      const next: App = {
        ...existing,
        ...patch,
        id: existing.id,
        createdAt: existing.createdAt,
        updatedAt: nowIso(),
        version: existing.version + 1,
        tables: patch.tables ?? existing.tables,
        pages: patch.pages ?? existing.pages,
        handlers: patch.handlers ?? existing.handlers,
        workflows: patch.workflows ?? existing.workflows,
      };

      assertValidAppTables(next.tables);
      assertAppComplete(next);

      this.apps.set(id, next);
      return ok(next);
    } catch (e) {
      return err(toMindPressError(e, "APP_UPDATE_FAILED"));
    }
  }

  get(id: AppId): App | undefined {
    return this.apps.get(id);
  }

  list(filter?: {
    visibility?: App["visibility"];
    status?: App["status"];
  }): App[] {
    let values = [...this.apps.values()];
    if (filter?.visibility) {
      values = values.filter((a) => a.visibility === filter.visibility);
    }
    if (filter?.status) {
      values = values.filter((a) => a.status === filter.status);
    }
    return values;
  }

  delete(id: AppId): boolean {
    return this.apps.delete(id);
  }

  clear(): void {
    this.apps.clear();
  }
}

function toMindPressError(e: unknown, fallbackCode: string): MindPressError {
  if (e instanceof MindPressError) {
    return e;
  }
  if (e instanceof Error) {
    return new MindPressError(e.message, fallbackCode);
  }
  return new MindPressError(String(e), fallbackCode);
}
