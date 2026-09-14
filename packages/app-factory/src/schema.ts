import { MindPressError } from "@mindpress/shared";
import type {
  TableDefinition,
  TableFieldDefinition,
  TableFieldType,
} from "./types.js";

const VALID_FIELD_TYPES: ReadonlySet<TableFieldType> = new Set([
  "string",
  "number",
  "boolean",
  "datetime",
  "json",
  "ref",
  "enum",
]);

const IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export interface SchemaValidationIssue {
  path: string;
  message: string;
}

export interface SchemaValidationResult {
  ok: boolean;
  issues: SchemaValidationIssue[];
}

function issue(path: string, message: string): SchemaValidationIssue {
  return { path, message };
}

function validateField(
  field: TableFieldDefinition,
  path: string,
): SchemaValidationIssue[] {
  const issues: SchemaValidationIssue[] = [];

  if (!field.name || !IDENTIFIER.test(field.name)) {
    issues.push(
      issue(
        `${path}.name`,
        "Field name must be a non-empty identifier (letters, digits, underscore)",
      ),
    );
  }

  if (!VALID_FIELD_TYPES.has(field.type)) {
    issues.push(issue(`${path}.type`, `Unknown field type: ${String(field.type)}`));
  }

  if (field.type === "enum") {
    if (!field.enumValues || field.enumValues.length === 0) {
      issues.push(
        issue(`${path}.enumValues`, "enum fields require a non-empty enumValues list"),
      );
    }
  }

  if (field.type === "ref") {
    if (!field.refTableId || !field.refTableId.trim()) {
      issues.push(
        issue(`${path}.refTableId`, "ref fields require refTableId"),
      );
    }
  }

  return issues;
}

/** Validate a single table schema definition. */
export function validateTableSchema(
  table: TableDefinition,
): SchemaValidationResult {
  const issues: SchemaValidationIssue[] = [];

  if (!table.id?.trim()) {
    issues.push(issue("id", "Table id is required"));
  }
  if (!table.name?.trim()) {
    issues.push(issue("name", "Table name is required"));
  }
  if (!table.fields || table.fields.length === 0) {
    issues.push(issue("fields", "Table must declare at least one field"));
  }

  const names = new Set<string>();
  for (let i = 0; i < (table.fields?.length ?? 0); i++) {
    const field = table.fields[i]!;
    const path = `fields[${i}]`;
    issues.push(...validateField(field, path));
    if (field.name) {
      if (names.has(field.name)) {
        issues.push(issue(path, `Duplicate field name: ${field.name}`));
      }
      names.add(field.name);
    }
  }

  if (!table.primaryKey?.trim()) {
    issues.push(issue("primaryKey", "primaryKey is required"));
  } else if (table.fields?.length && !names.has(table.primaryKey)) {
    issues.push(
      issue(
        "primaryKey",
        `primaryKey "${table.primaryKey}" is not among declared fields`,
      ),
    );
  }

  if (table.indexes) {
    for (let i = 0; i < table.indexes.length; i++) {
      const idx = table.indexes[i]!;
      if (!names.has(idx)) {
        issues.push(
          issue(`indexes[${i}]`, `Index field "${idx}" is not among declared fields`),
        );
      }
    }
  }

  // Cross-check ref targets within the same table list is done by validateAppTables.
  return { ok: issues.length === 0, issues };
}

/**
 * Validate a set of tables for an app, including cross-table ref integrity.
 */
export function validateAppTables(
  tables: TableDefinition[],
): SchemaValidationResult {
  const issues: SchemaValidationIssue[] = [];
  const tableIds = new Set<string>();

  for (let t = 0; t < tables.length; t++) {
    const table = tables[t]!;
    const result = validateTableSchema(table);
    for (const item of result.issues) {
      issues.push(issue(`tables[${t}].${item.path}`, item.message));
    }
    if (table.id) {
      if (tableIds.has(table.id)) {
        issues.push(issue(`tables[${t}].id`, `Duplicate table id: ${table.id}`));
      }
      tableIds.add(table.id);
    }
  }

  for (let t = 0; t < tables.length; t++) {
    const table = tables[t]!;
    for (let f = 0; f < (table.fields?.length ?? 0); f++) {
      const field = table.fields[f]!;
      if (field.type === "ref" && field.refTableId) {
        if (!tableIds.has(field.refTableId)) {
          issues.push(
            issue(
              `tables[${t}].fields[${f}].refTableId`,
              `refTableId "${field.refTableId}" does not match any table in this app`,
            ),
          );
        }
      }
    }
  }

  return { ok: issues.length === 0, issues };
}

/** Throw MindPressError when schema validation fails. */
export function assertValidTableSchema(table: TableDefinition): void {
  const result = validateTableSchema(table);
  if (!result.ok) {
    throw new MindPressError("Invalid table schema", "INVALID_TABLE_SCHEMA", {
      issues: result.issues,
    });
  }
}

/** Throw MindPressError when app table set validation fails. */
export function assertValidAppTables(tables: TableDefinition[]): void {
  const result = validateAppTables(tables);
  if (!result.ok) {
    throw new MindPressError("Invalid app table set", "INVALID_APP_TABLES", {
      issues: result.issues,
    });
  }
}
