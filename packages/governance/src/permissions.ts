import {
  err,
  ok,
  type PermissionAction,
  type PermissionScope,
  type Principal,
  type ResourceKind,
  type Result,
  MindPressError,
} from "@mindpress/shared";

export interface PermissionCheckRequest {
  principal: Principal;
  resource: ResourceKind;
  resourceId?: string;
  action: PermissionAction;
}

/**
 * Agents propose; authority (scopes on the Principal) allow.
 * Minimum-access: a scope must match resource kind, optional id, and action.
 */
export class PermissionChecker {
  check(request: PermissionCheckRequest): Result<true, MindPressError> {
    const allowed = request.principal.scopes.some((scope) =>
      scopeAllows(scope, request),
    );

    if (!allowed) {
      return err(
        new MindPressError(
          `Principal ${request.principal.id} lacks ${request.action} on ${request.resource}${
            request.resourceId ? `:${request.resourceId}` : ""
          }`,
          "PERMISSION_DENIED",
          {
            principalId: request.principal.id,
            resource: request.resource,
            resourceId: request.resourceId,
            action: request.action,
          },
        ),
      );
    }

    return ok(true);
  }

  has(request: PermissionCheckRequest): boolean {
    return this.check(request).ok;
  }
}

function scopeAllows(
  scope: PermissionScope,
  request: PermissionCheckRequest,
): boolean {
  if (scope.resource !== request.resource) {
    return false;
  }
  if (
    scope.resourceId !== undefined &&
    request.resourceId !== undefined &&
    scope.resourceId !== request.resourceId
  ) {
    return false;
  }
  if (
    scope.resourceId !== undefined &&
    request.resourceId === undefined
  ) {
    // Scoped to a specific id cannot authorize unbounded resource access.
    return false;
  }
  return scope.actions.includes(request.action) || scope.actions.includes("admin");
}
