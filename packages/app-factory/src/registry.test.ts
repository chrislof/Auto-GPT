import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  type AppId,
  type PrincipalId,
  createId,
} from "@mindpress/shared";
import {
  AppRegistry,
  assessAppCompleteness,
  createRollbackPlan,
  validateTableSchema,
  type CreateAppInput,
} from "./index.js";

function completeAppInput(
  overrides: Partial<CreateAppInput> = {},
): CreateAppInput {
  const rollback = createRollbackPlan({
    appId: createId<AppId>("app"),
    summary: "Restore prior configuration and freeze writes",
    steps: [
      "Freeze mutable handlers",
      "Restore prior app version",
      "Verify source-of-truth consistency",
    ],
    affectedSystems: ["app-registry", "crm"],
    authorizationScopes: [
      { resource: "app", actions: ["admin"] },
    ],
  });

  return {
    name: "Exception Queue",
    description: "Surfaces finance exceptions needing human judgment",
    status: "draft",
    visibility: "internal",
    owner: "controller@example.com",
    sourceOfTruth: {
      primary: "erp.gl",
      secondary: ["bank.feed"],
      freshnessNotes: "Nightly sync via connector",
    },
    accessPolicy: {
      visibility: "internal",
      adminScopes: [{ resource: "app", actions: ["admin"] }],
      userScopes: [{ resource: "app", actions: ["read", "write"] }],
    },
    outcome: {
      metric: {
        id: "exception_cycle_time",
        name: "Exception cycle time",
        definition: "Median hours from exception open to close",
        owner: "controller@example.com",
        unit: "hours",
        direction: "decrease",
      },
      baseline: "48h",
      target: "12h",
    },
    rollbackPlanId: rollback.id,
    tables: [
      {
        id: "exceptions",
        name: "Exceptions",
        primaryKey: "id",
        fields: [
          { name: "id", type: "string", required: true },
          { name: "amount", type: "number", required: true },
          { name: "status", type: "enum", enumValues: ["open", "closed"] },
        ],
      },
    ],
    pages: [
      {
        id: "queue",
        title: "Exception queue",
        path: "/exceptions",
        tableIds: ["exceptions"],
      },
    ],
    handlers: [
      {
        id: "close_exception",
        name: "Close exception",
        entry: "handlers/close.ts",
        allowlist: [{ resource: "handler", actions: ["execute"] }],
        timeoutMs: 5_000,
        mutable: true,
      },
    ],
    workflows: [
      {
        id: "nightly_import",
        name: "Nightly exception import",
        trigger: { kind: "schedule", cron: "0 6 * * *" },
        steps: [{ kind: "handler", handlerId: "close_exception" }],
      },
    ],
    ...overrides,
  };
}

describe("AppRegistry", () => {
  it("creates an app with generated id and version 1", () => {
    const registry = new AppRegistry();
    const result = registry.create(completeAppInput());
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.match(result.value.id, /^app_/);
    assert.equal(result.value.version, 1);
    assert.equal(result.value.name, "Exception Queue");
    assert.equal(registry.get(result.value.id)?.id, result.value.id);
  });

  it("updates an app and increments version", () => {
    const registry = new AppRegistry();
    const created = registry.create(completeAppInput());
    assert.equal(created.ok, true);
    if (!created.ok) return;

    const updated = registry.update(created.value.id, {
      description: "Updated description",
      status: "active",
    });
    assert.equal(updated.ok, true);
    if (!updated.ok) return;
    assert.equal(updated.value.version, 2);
    assert.equal(updated.value.description, "Updated description");
    assert.equal(updated.value.status, "active");
    assert.equal(updated.value.createdAt, created.value.createdAt);
  });

  it("rejects create when app id already exists", () => {
    const registry = new AppRegistry();
    const id = createId<AppId>("app");
    const first = registry.create(completeAppInput({ id }));
    assert.equal(first.ok, true);
    const second = registry.create(completeAppInput({ id }));
    assert.equal(second.ok, false);
    if (second.ok) return;
    assert.equal(second.error.code, "APP_ALREADY_EXISTS");
  });

  it("rejects update for unknown app", () => {
    const registry = new AppRegistry();
    const result = registry.update(createId<AppId>("app"), { name: "Nope" });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.error.code, "APP_NOT_FOUND");
  });

  it("lists apps by visibility and status", () => {
    const registry = new AppRegistry();
    registry.create(
      completeAppInput({ name: "Internal A", visibility: "internal", status: "active" }),
    );
    registry.create(
      completeAppInput({
        name: "External B",
        visibility: "external",
        status: "draft",
        accessPolicy: {
          visibility: "external",
          adminScopes: [{ resource: "app", actions: ["admin"] }],
          userScopes: [{ resource: "app", actions: ["read"] }],
          allowlistPrincipalIds: [createId<PrincipalId>("prin")],
        },
      }),
    );

    assert.equal(registry.list({ visibility: "external" }).length, 1);
    assert.equal(registry.list({ status: "active" }).length, 1);
  });
});

describe("app completeness rules", () => {
  it("reports gaps when required fields are missing", () => {
    const incomplete = completeAppInput({
      owner: "",
      sourceOfTruth: { primary: "" },
      accessPolicy: {
        visibility: "internal",
        adminScopes: [],
        userScopes: [],
      },
      outcome: {
        metric: {
          id: "",
          name: "",
          definition: "",
          owner: "",
          unit: "",
          direction: "decrease",
        },
      },
      rollbackPlanId: "",
    });

    // Bypass registry create (which asserts completeness) by building a raw shape.
    const report = assessAppCompleteness({
      ...incomplete,
      id: createId<AppId>("app"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      tables: incomplete.tables ?? [],
      pages: incomplete.pages ?? [],
      handlers: incomplete.handlers ?? [],
      workflows: incomplete.workflows ?? [],
    });

    assert.equal(report.complete, false);
    assert.deepEqual(
      [...report.gaps].sort(),
      [
        "accessPolicy",
        "outcome",
        "owner",
        "rollbackPath",
        "sourceOfTruth",
      ],
    );
  });

  it("rejects registry create when completeness fails", () => {
    const registry = new AppRegistry();
    const result = registry.create(completeAppInput({ owner: "   " }));
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.error.code, "APP_INCOMPLETE");
  });

  it("rejects registry update that removes completeness", () => {
    const registry = new AppRegistry();
    const created = registry.create(completeAppInput());
    assert.equal(created.ok, true);
    if (!created.ok) return;

    const updated = registry.update(created.value.id, { rollbackPlanId: "" });
    assert.equal(updated.ok, false);
    if (updated.ok) return;
    assert.equal(updated.error.code, "APP_INCOMPLETE");
  });

  it("accepts a complete app", () => {
    const registry = new AppRegistry();
    const result = registry.create(completeAppInput());
    assert.equal(result.ok, true);
    if (!result.ok) return;
    const report = assessAppCompleteness(result.value);
    assert.equal(report.complete, true);
    assert.deepEqual(report.gaps, []);
  });
});

describe("schema validation", () => {
  it("flags invalid primary key and enum fields", () => {
    const result = validateTableSchema({
      id: "t1",
      name: "T1",
      primaryKey: "missing",
      fields: [
        { name: "id", type: "string" },
        { name: "status", type: "enum" },
      ],
    });
    assert.equal(result.ok, false);
    assert.ok(result.issues.some((i) => i.path === "primaryKey"));
    assert.ok(result.issues.some((i) => i.path.includes("enumValues")));
  });
});
