import {
  err,
  ok,
  type Principal,
  type Result,
  MindPressError,
} from "@mindpress/shared";

/**
 * Authenticate a principal for MCP tool calls.
 * Stub: accepts a pre-resolved Principal (injected by the host).
 * Real deployments plug OAuth / API keys / mTLS here.
 */
export interface Authenticator {
  authenticate(credential: unknown): Result<Principal, MindPressError>;
}

export class StaticPrincipalAuthenticator implements Authenticator {
  constructor(private readonly principals: Map<string, Principal>) {}

  authenticate(credential: unknown): Result<Principal, MindPressError> {
    if (
      typeof credential !== "object" ||
      credential === null ||
      !("principalId" in credential) ||
      typeof (credential as { principalId: unknown }).principalId !== "string"
    ) {
      return err(
        new MindPressError(
          "Missing principalId credential",
          "UNAUTHENTICATED",
        ),
      );
    }

    const id = (credential as { principalId: string }).principalId;
    const principal = this.principals.get(id);
    if (!principal) {
      return err(
        new MindPressError("Unknown principal", "UNAUTHENTICATED", {
          principalId: id,
        }),
      );
    }
    return ok(principal);
  }
}
