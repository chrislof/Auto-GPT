import { createId } from "@mindpress/shared";

export type EvalCaseId = string & { readonly __brand: "EvalCaseId" };
export type EvalSetId = string & { readonly __brand: "EvalSetId" };
export type EvalRunId = string & { readonly __brand: "EvalRunId" };

export type ExpectedBehavior =
  | { kind: "allow" }
  | { kind: "deny"; code?: string }
  | { kind: "require_approval"; actionKind?: string }
  | { kind: "produce"; contains?: string[]; notContains?: string[] };

export interface EvalCase {
  id: EvalCaseId;
  name: string;
  description: string;
  /** Structured input the system under test receives. */
  input: Record<string, unknown>;
  expected: ExpectedBehavior;
  tags?: string[];
}

export interface EvalCaseResult {
  caseId: EvalCaseId;
  passed: boolean;
  actual: Record<string, unknown>;
  message: string;
}

export interface EvaluationSet {
  id: EvalSetId;
  name: string;
  description: string;
  cases: EvalCase[];
  createdAt: string;
}

export interface EvalRun {
  id: EvalRunId;
  setId: EvalSetId;
  at: string;
  results: EvalCaseResult[];
  passCount: number;
  failCount: number;
}

/**
 * Evaluation set model: cases, expected behaviors, pass/fail runs.
 * Production AI requires representative evaluation cases (manifesto proof standard).
 */
export class EvaluationRegistry {
  private readonly sets = new Map<EvalSetId, EvaluationSet>();
  private readonly runs: EvalRun[] = [];

  createSet(input: {
    name: string;
    description: string;
    cases?: Omit<EvalCase, "id">[];
  }): EvaluationSet {
    const id = createId<EvalSetId>("evalset");
    const set: EvaluationSet = {
      id,
      name: input.name,
      description: input.description,
      cases: (input.cases ?? []).map((c) => ({
        ...c,
        id: createId<EvalCaseId>("evalcase"),
      })),
      createdAt: new Date().toISOString(),
    };
    this.sets.set(id, set);
    return set;
  }

  addCase(
    setId: EvalSetId,
    caseInput: Omit<EvalCase, "id">,
  ): EvalCase | undefined {
    const set = this.sets.get(setId);
    if (!set) return undefined;
    const evalCase: EvalCase = {
      ...caseInput,
      id: createId<EvalCaseId>("evalcase"),
    };
    set.cases.push(evalCase);
    return evalCase;
  }

  getSet(setId: EvalSetId): EvaluationSet | undefined {
    return this.sets.get(setId);
  }

  listSets(): EvaluationSet[] {
    return [...this.sets.values()];
  }

  /**
   * Score a run against expected behaviors.
   * Caller supplies actual outcomes per case (agent/system under test).
   */
  recordRun(
    setId: EvalSetId,
    actuals: Array<{
      caseId: EvalCaseId;
      actual: Record<string, unknown>;
    }>,
  ): EvalRun | undefined {
    const set = this.sets.get(setId);
    if (!set) return undefined;

    const byId = new Map(actuals.map((a) => [a.caseId, a.actual]));
    const results: EvalCaseResult[] = set.cases.map((c) => {
      const actual = byId.get(c.id) ?? {};
      return scoreCase(c, actual);
    });

    const passCount = results.filter((r) => r.passed).length;
    const run: EvalRun = {
      id: createId<EvalRunId>("evalrun"),
      setId,
      at: new Date().toISOString(),
      results,
      passCount,
      failCount: results.length - passCount,
    };
    this.runs.push(run);
    return run;
  }

  listRuns(setId?: EvalSetId): EvalRun[] {
    return setId ? this.runs.filter((r) => r.setId === setId) : [...this.runs];
  }
}

function scoreCase(
  evalCase: EvalCase,
  actual: Record<string, unknown>,
): EvalCaseResult {
  const outcome = String(actual["outcome"] ?? "");
  const code = actual["code"] !== undefined ? String(actual["code"]) : undefined;

  switch (evalCase.expected.kind) {
    case "allow": {
      const passed = outcome === "allowed" || outcome === "ok" || outcome === "executed";
      return {
        caseId: evalCase.id,
        passed,
        actual,
        message: passed ? "allowed as expected" : `expected allow, got ${outcome || "unknown"}`,
      };
    }
    case "deny": {
      const denied = outcome === "denied" || outcome === "error";
      const codeOk =
        !evalCase.expected.code || code === evalCase.expected.code;
      const passed = denied && codeOk;
      return {
        caseId: evalCase.id,
        passed,
        actual,
        message: passed
          ? "denied as expected"
          : `expected deny${evalCase.expected.code ? ` (${evalCase.expected.code})` : ""}, got ${outcome || "unknown"}`,
      };
    }
    case "require_approval": {
      const passed =
        outcome === "approval_required" ||
        outcome === "proposed" ||
        (code === "APPROVAL_REQUIRED");
      return {
        caseId: evalCase.id,
        passed,
        actual,
        message: passed
          ? "approval required as expected"
          : `expected require_approval, got ${outcome || "unknown"}`,
      };
    }
    case "produce": {
      const text = JSON.stringify(actual);
      const missing = (evalCase.expected.contains ?? []).filter(
        (s) => !text.includes(s),
      );
      const forbidden = (evalCase.expected.notContains ?? []).filter((s) =>
        text.includes(s),
      );
      const passed = missing.length === 0 && forbidden.length === 0;
      return {
        caseId: evalCase.id,
        passed,
        actual,
        message: passed
          ? "produce checks passed"
          : `produce failed; missing=${missing.join(",")} forbidden=${forbidden.join(",")}`,
      };
    }
  }
}
