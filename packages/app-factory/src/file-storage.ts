import type { AppId, PrincipalId, Result } from "@mindpress/shared";
import { MindPressError, createId, err, ok } from "@mindpress/shared";
import type { FileObject } from "./types.js";

/** Short-lived URL for private file access. */
export interface ShortLivedFileUrl {
  fileId: string;
  url: string;
  /** ISO-8601 expiry — URLs must be short-lived. */
  expiresAt: string;
}

export interface PutFileInput {
  appId: AppId;
  path: string;
  contentType: string;
  sizeBytes: number;
  createdBy: PrincipalId;
  tags?: string[];
}

/**
 * Private file storage interface.
 *
 * Implementations keep objects private by default and mint short-lived URLs
 * for authorized download/upload. No concrete cloud SDK is required here.
 */
export interface FileStorage {
  put(input: PutFileInput): Promise<Result<FileObject, MindPressError>>;
  get(fileId: string): Promise<Result<FileObject, MindPressError>>;
  /**
   * Mint a short-lived URL. Callers must pass a positive TTL;
   * implementations should reject overly long TTLs in production.
   */
  createShortLivedUrl(
    fileId: string,
    ttlSeconds: number,
  ): Promise<Result<ShortLivedFileUrl, MindPressError>>;
  delete(fileId: string): Promise<Result<true, MindPressError>>;
}

const DEFAULT_MAX_TTL_SECONDS = 60 * 15; // 15 minutes

/**
 * In-memory FileStorage stub for tests and local scaffolding.
 * Does not store bytes — only metadata and synthetic short-lived URLs.
 */
export class InMemoryFileStorage implements FileStorage {
  private readonly files = new Map<string, FileObject>();
  private readonly maxTtlSeconds: number;

  constructor(options?: { maxTtlSeconds?: number }) {
    this.maxTtlSeconds = options?.maxTtlSeconds ?? DEFAULT_MAX_TTL_SECONDS;
  }

  async put(input: PutFileInput): Promise<Result<FileObject, MindPressError>> {
    if (!input.path.trim()) {
      return err(new MindPressError("File path is required", "FILE_INVALID"));
    }
    const file: FileObject = {
      id: createId<string>("file"),
      appId: input.appId,
      path: input.path,
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
      createdAt: new Date().toISOString(),
      createdBy: input.createdBy,
      tags: input.tags,
    };
    this.files.set(file.id, file);
    return ok(file);
  }

  async get(fileId: string): Promise<Result<FileObject, MindPressError>> {
    const file = this.files.get(fileId);
    if (!file) {
      return err(
        new MindPressError(`File not found: ${fileId}`, "FILE_NOT_FOUND", {
          fileId,
        }),
      );
    }
    return ok(file);
  }

  async createShortLivedUrl(
    fileId: string,
    ttlSeconds: number,
  ): Promise<Result<ShortLivedFileUrl, MindPressError>> {
    const file = this.files.get(fileId);
    if (!file) {
      return err(
        new MindPressError(`File not found: ${fileId}`, "FILE_NOT_FOUND", {
          fileId,
        }),
      );
    }
    if (ttlSeconds <= 0 || ttlSeconds > this.maxTtlSeconds) {
      return err(
        new MindPressError(
          `ttlSeconds must be between 1 and ${this.maxTtlSeconds}`,
          "FILE_TTL_INVALID",
          { ttlSeconds, maxTtlSeconds: this.maxTtlSeconds },
        ),
      );
    }
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    return ok({
      fileId,
      url: `mindpress-file://private/${file.appId}/${file.id}?exp=${encodeURIComponent(expiresAt)}`,
      expiresAt,
    });
  }

  async delete(fileId: string): Promise<Result<true, MindPressError>> {
    if (!this.files.delete(fileId)) {
      return err(
        new MindPressError(`File not found: ${fileId}`, "FILE_NOT_FOUND", {
          fileId,
        }),
      );
    }
    return ok(true);
  }
}
