import type { AppId, PrincipalId, Result } from "@mindpress/shared";
import { MindPressError, err, ok } from "@mindpress/shared";
import type { HandlerDefinition } from "./types.js";

export interface HandlerInvocationRequest {
  appId: AppId;
  handler: HandlerDefinition;
  principalId: PrincipalId;
  /** Opaque JSON-serializable payload. */
  payload: unknown;
  /** Correlation id for audit / tracing. */
  correlationId?: string;
}

export interface HandlerInvocationResult {
  handlerId: string;
  appId: AppId;
  status: "succeeded" | "failed" | "timeout";
  /** Stub output — real runtimes return handler-defined values. */
  output?: unknown;
  errorMessage?: string;
  durationMs: number;
  /** Isolation boundary id for this invocation. */
  isolationBoundaryId: string;
}

/**
 * Isolated handler runtime (stub).
 *
 * Isolation boundary (intentional contract notes — not a real sandbox):
 * ---------------------------------------------------------------------------
 * 1. PROCESS / WORKER BOUNDARY
 *    Each invocation should run in a dedicated worker, isolate, or container.
 *    The host process must not share mutable memory with handler code.
 *
 * 2. CREDENTIAL BOUNDARY
 *    Handlers never receive warehouse passwords, long-lived file keys, or
 *    broad admin tokens. They receive scoped short-lived capabilities only.
 *
 * 3. NETWORK BOUNDARY
 *    Egress is allowlisted. Default deny for unexpected destinations.
 *
 * 4. TIME / RESOURCE BOUNDARY
 *    timeoutMs on HandlerDefinition is enforced; CPU/memory caps apply.
 *
 * 5. DATA BOUNDARY
 *    App tables and files are accessed through mediated APIs, not raw FS/DB.
 * ---------------------------------------------------------------------------
 * This stub records the boundary id and simulates success without executing
 * untrusted code. Replace with a real isolate runner in production.
 */
export class HandlerRuntime {
  async invoke(
    request: HandlerInvocationRequest,
  ): Promise<Result<HandlerInvocationResult, MindPressError>> {
    const started = Date.now();
    const isolationBoundaryId = `iso_${request.appId}_${request.handler.id}_${started.toString(36)}`;

    if (!request.handler.entry?.trim()) {
      return err(
        new MindPressError(
          "Handler entry is required",
          "HANDLER_INVALID",
          { handlerId: request.handler.id },
        ),
      );
    }

    if (request.handler.timeoutMs <= 0) {
      return err(
        new MindPressError(
          "Handler timeoutMs must be positive",
          "HANDLER_INVALID",
          { handlerId: request.handler.id },
        ),
      );
    }

    // Stub: no real code execution crosses the isolation boundary.
    // A production runner would spawn the isolate here, inject scoped
    // capabilities, enforce timeoutMs, and capture structured output.
    const durationMs = Date.now() - started;

    return ok({
      handlerId: request.handler.id,
      appId: request.appId,
      status: "succeeded",
      output: {
        stub: true,
        message: "HandlerRuntime stub — isolation boundary recorded, no code executed",
        payloadEcho: request.payload,
        principalId: request.principalId,
        correlationId: request.correlationId,
      },
      durationMs,
      isolationBoundaryId,
    });
  }
}
