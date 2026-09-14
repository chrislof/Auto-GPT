/**
 * @mindpress/app-factory
 *
 * Company app factory contracts: apps, tables, pages, handlers,
 * workflows, private files, warehouse queries, and rollback plans.
 */

export type {
  App,
  AppAccessPolicy,
  AppOutcome,
  AppStatus,
  AppVisibility,
  CreateAppInput,
  FileObject,
  HandlerDefinition,
  PageDefinition,
  RollbackChecklistItem,
  RollbackPlan,
  SignedQueryToken,
  SourceOfTruth,
  TableDefinition,
  TableFieldDefinition,
  TableFieldType,
  UpdateAppInput,
  WarehouseQuery,
  WorkflowDefinition,
  WorkflowStep,
  WorkflowTrigger,
} from "./types.js";

export {
  assessAppCompleteness,
  assertAppComplete,
  AppRegistry,
  type AppCompletenessGap,
  type AppCompletenessReport,
} from "./registry.js";

export {
  assertValidAppTables,
  assertValidTableSchema,
  validateAppTables,
  validateTableSchema,
  type SchemaValidationIssue,
  type SchemaValidationResult,
} from "./schema.js";

export {
  HandlerRuntime,
  type HandlerInvocationRequest,
  type HandlerInvocationResult,
} from "./handler-runtime.js";

export {
  WarehouseQueryService,
  type WarehouseQueryRequest,
  type WarehouseQueryResult,
} from "./warehouse.js";

export {
  InMemoryFileStorage,
  type FileStorage,
  type PutFileInput,
  type ShortLivedFileUrl,
} from "./file-storage.js";

export {
  createRollbackPlan,
  formatRehearsalChecklist,
  isRollbackRehearsalComplete,
  markRehearsalProgress,
  type CreateRollbackPlanInput,
} from "./rollback.js";
