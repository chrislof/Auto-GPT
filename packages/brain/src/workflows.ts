import { createId, err, ok, type Result } from "@mindpress/shared";
import type {
  EscalationLevel,
  ExceptionType,
  ExceptionTypeId,
  MetricDefId,
  SystemId,
  WorkflowDefinition,
  WorkflowId,
} from "./types.ts";

export interface RegisterWorkflowInput {
  name: string;
  description?: string;
  owner: string;
  steps?: string[];
  relatedMetricIds?: MetricDefId[];
  relatedSystemIds?: SystemId[];
}

export interface RegisterExceptionInput {
  workflowId: WorkflowId;
  name: string;
  description?: string;
  owner: string;
  escalation: EscalationLevel;
  severity?: ExceptionType["severity"];
}

export interface WorkflowMap {
  registerWorkflow(input: RegisterWorkflowInput): Result<WorkflowDefinition>;
  registerException(input: RegisterExceptionInput): Result<ExceptionType>;
  getWorkflow(id: WorkflowId): WorkflowDefinition | undefined;
  getException(id: ExceptionTypeId): ExceptionType | undefined;
  listWorkflows(): WorkflowDefinition[];
  listExceptions(workflowId?: WorkflowId): ExceptionType[];
}

export function createWorkflowMap(seed?: {
  workflows?: WorkflowDefinition[];
  exceptions?: ExceptionType[];
}): WorkflowMap {
  const workflows = new Map<WorkflowId, WorkflowDefinition>();
  const exceptions = new Map<ExceptionTypeId, ExceptionType>();

  for (const w of seed?.workflows ?? []) workflows.set(w.id, w);
  for (const e of seed?.exceptions ?? []) exceptions.set(e.id, e);

  return {
    registerWorkflow(input) {
      if (!input.name.trim()) {
        return err(new Error("Workflow name is required"));
      }
      if (!input.owner.trim()) {
        return err(new Error("Workflow owner is required"));
      }

      const workflow: WorkflowDefinition = {
        id: createId<WorkflowId>("wf"),
        name: input.name.trim(),
        description: input.description?.trim() ?? "",
        owner: input.owner.trim(),
        steps: input.steps ?? [],
        relatedMetricIds: input.relatedMetricIds ?? [],
        relatedSystemIds: input.relatedSystemIds ?? [],
      };
      workflows.set(workflow.id, workflow);
      return ok(workflow);
    },

    registerException(input) {
      if (!workflows.has(input.workflowId)) {
        return err(new Error(`Unknown workflow: ${input.workflowId}`));
      }
      if (!input.name.trim()) {
        return err(new Error("Exception name is required"));
      }
      if (!input.owner.trim()) {
        return err(new Error("Exception owner is required"));
      }

      const exception: ExceptionType = {
        id: createId<ExceptionTypeId>("exc"),
        workflowId: input.workflowId,
        name: input.name.trim(),
        description: input.description?.trim() ?? "",
        owner: input.owner.trim(),
        escalation: input.escalation,
        severity: input.severity ?? "medium",
      };
      exceptions.set(exception.id, exception);
      return ok(exception);
    },

    getWorkflow(id) {
      return workflows.get(id);
    },

    getException(id) {
      return exceptions.get(id);
    },

    listWorkflows() {
      return [...workflows.values()];
    },

    listExceptions(workflowId) {
      const all = [...exceptions.values()];
      return workflowId
        ? all.filter((e) => e.workflowId === workflowId)
        : all;
    },
  };
}
