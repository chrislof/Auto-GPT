/**
 * Cost and latency budget tracker stubs.
 * Production AI requires cost and latency limits (manifesto proof standard).
 */

export interface BudgetLimits {
  maxCostUsd: number;
  maxLatencyMs: number;
  maxTokens?: number;
}

export interface BudgetUsage {
  costUsd: number;
  latencyMs: number;
  tokens: number;
  calls: number;
}

export interface BudgetSnapshot {
  name: string;
  limits: BudgetLimits;
  usage: BudgetUsage;
  exceeded: Array<"cost" | "latency" | "tokens">;
}

export class BudgetTracker {
  private readonly limits: BudgetLimits;
  private usage: BudgetUsage = {
    costUsd: 0,
    latencyMs: 0,
    tokens: 0,
    calls: 0,
  };

  constructor(
    readonly name: string,
    limits: BudgetLimits,
  ) {
    this.limits = { ...limits };
  }

  /** Stub: record a call's observed cost/latency. Does not block; use check(). */
  record(sample: { costUsd?: number; latencyMs?: number; tokens?: number }): void {
    this.usage = {
      costUsd: this.usage.costUsd + (sample.costUsd ?? 0),
      latencyMs: Math.max(this.usage.latencyMs, sample.latencyMs ?? 0),
      tokens: this.usage.tokens + (sample.tokens ?? 0),
      calls: this.usage.calls + 1,
    };
  }

  check(): BudgetSnapshot {
    const exceeded: Array<"cost" | "latency" | "tokens"> = [];
    if (this.usage.costUsd > this.limits.maxCostUsd) exceeded.push("cost");
    if (this.usage.latencyMs > this.limits.maxLatencyMs) exceeded.push("latency");
    if (
      this.limits.maxTokens !== undefined &&
      this.usage.tokens > this.limits.maxTokens
    ) {
      exceeded.push("tokens");
    }
    return {
      name: this.name,
      limits: { ...this.limits },
      usage: { ...this.usage },
      exceeded,
    };
  }

  reset(): void {
    this.usage = { costUsd: 0, latencyMs: 0, tokens: 0, calls: 0 };
  }
}
