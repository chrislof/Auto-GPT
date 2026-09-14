/**
 * Narrow ports so mcp-server does not tightly couple to unfinished brain / app-factory packages.
 * Inject adapters at composition time.
 */

export interface BrainSummary {
  companyName: string;
  entityCount: number;
  freshnessNote: string;
  highlights: string[];
}

export interface BrainEntity {
  id: string;
  kind: string;
  name: string;
  attributes?: Record<string, unknown>;
}

export interface BrainPort {
  getSummary(scope?: { entityKinds?: string[] }): Promise<BrainSummary>;
  listEntities(filter?: {
    kind?: string;
    limit?: number;
  }): Promise<BrainEntity[]>;
}

export interface AppSummary {
  id: string;
  name: string;
  owner: string;
  job: string;
}

export interface AppContext {
  id: string;
  name: string;
  owner: string;
  job: string;
  tables: string[];
  pages: string[];
  accessPolicy: string;
}

export interface AppFactoryPort {
  listApps(): Promise<AppSummary[]>;
  getContext(appId: string): Promise<AppContext | undefined>;
}

export interface WarehouseQueryResult {
  columns: string[];
  rows: unknown[][];
  rowCount: number;
}

export interface WarehousePort {
  /**
   * Execute a governed read-only query. Implementations must verify the signed token.
   */
  runReadonlyQuery(input: {
    sql: string;
    signedToken: string;
  }): Promise<WarehouseQueryResult>;
}

export interface WorkflowEnqueueResult {
  jobId: string;
  status: "queued";
}

export interface WorkflowPort {
  enqueue(input: {
    workflowId: string;
    payload: Record<string, unknown>;
  }): Promise<WorkflowEnqueueResult>;
}

export interface MindPressPorts {
  brain: BrainPort;
  apps: AppFactoryPort;
  warehouse: WarehousePort;
  workflows: WorkflowPort;
}
