import { createHash } from "node:crypto";
import { z } from "zod";
import { type SourceIngestionMethod, type SourceRegistryRecord, assertSourceMayBeAcquired, sourceIngestionMethods } from "@/src/nuru/source-intelligence";

const sourceDocumentIdentitySchema = z.object({
  organization: z.string().trim().min(1).max(180),
  publicationOrSystem: z.string().trim().min(1).max(180),
  document: z.string().trim().min(1).max(500),
  version: z.string().trim().min(1).max(180),
});

export const sourceAcquisitionStates = ["CAPTURED", "TIMEOUT", "NOT_FOUND", "FORBIDDEN", "RATE_LIMITED", "MALFORMED", "EMPTY", "CHANGED", "DUPLICATE", "REDIRECTED", "UNAVAILABLE"] as const;
export type SourceAcquisitionState = (typeof sourceAcquisitionStates)[number];

export const sourceAcquisitionRequestSchema = z.object({
  sourceRegistryId: z.string().trim().min(1),
  acquisitionMethod: z.enum(sourceIngestionMethods),
  identity: sourceDocumentIdentitySchema,
  url: z.string().url(),
  previousContentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/).optional(),
  knownContentHashes: z.array(z.string().regex(/^sha256:[a-f0-9]{64}$/)).max(10_000).default([]),
});

export type SourceAcquisitionRequest = z.infer<typeof sourceAcquisitionRequestSchema>;

export interface SourceAcquisitionRegistryReader {
  get(id: string): Promise<SourceRegistryRecord | null>;
}

export interface SourceAcquisitionDiagnostic {
  sourceRegistryId: string;
  identity: z.infer<typeof sourceDocumentIdentitySchema>;
  requestedUrl: string;
  state: SourceAcquisitionState;
  status: number | null;
  redirectUrl: string | null;
  contentHash: string | null;
  detail: string;
}

export interface SourceAcquisitionDiagnosticStore {
  append(diagnostic: SourceAcquisitionDiagnostic): Promise<void>;
}

function hash(content: string) {
  return `sha256:${createHash("sha256").update(content, "utf8").digest("hex")}`;
}

function statusState(status: number): SourceAcquisitionState | null {
  if (status === 404) return "NOT_FOUND";
  if (status === 401 || status === 403) return "FORBIDDEN";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 300 && status < 400) return "REDIRECTED";
  if (status >= 500) return "UNAVAILABLE";
  return null;
}

function errorState(error: unknown): SourceAcquisitionState {
  if (error instanceof DOMException && error.name === "TimeoutError") return "TIMEOUT";
  if (error instanceof Error && /timeout|timed out|abort/i.test(error.message)) return "TIMEOUT";
  return "UNAVAILABLE";
}

/**
 * Captures source retrieval outcomes without equating a URL, source authority,
 * or successful fetch with truth. Callers can retain these diagnostics before
 * deciding whether any content should be admitted into Vault.
 */
export const NuruSourceAcquisitionService = {
  async acquire(rawRequest: z.input<typeof sourceAcquisitionRequestSchema>, input: { workspaceId: string }, registry: SourceAcquisitionRegistryReader, diagnostics: SourceAcquisitionDiagnosticStore, fetchImpl: typeof fetch = fetch) {
    const request = sourceAcquisitionRequestSchema.parse(rawRequest);
    const source = await registry.get(request.sourceRegistryId);
    if (!source || source.workspaceId !== input.workspaceId) {
      throw new Error("The selected source registry record does not exist in this workspace.");
    }
    assertSourceMayBeAcquired(source, request.acquisitionMethod as SourceIngestionMethod);

    const report = async (state: SourceAcquisitionState, detail: string, status: number | null = null, redirectUrl: string | null = null, contentHash: string | null = null) => {
      const diagnostic: SourceAcquisitionDiagnostic = { sourceRegistryId: source.id, identity: request.identity, requestedUrl: request.url, state, status, redirectUrl, contentHash, detail };
      await diagnostics.append(diagnostic);
      return diagnostic;
    };

    let response: Response;
    try {
      response = await fetchImpl(request.url, { redirect: "manual", signal: AbortSignal.timeout(8_000) });
    } catch (error) {
      return report(errorState(error), error instanceof Error ? error.message.slice(0, 1_000) : "Source request failed.");
    }

    const state = statusState(response.status);
    if (state) return report(state, `Source returned HTTP ${response.status}.`, response.status, response.headers.get("location"));
    if (!response.ok) return report("UNAVAILABLE", `Source returned HTTP ${response.status}.`, response.status);

    const contentType = response.headers.get("content-type") ?? "";
    if (!/^(text\/|application\/(json|xml|rss\+xml))/i.test(contentType)) {
      return report("MALFORMED", `Unexpected source content type: ${contentType || "unspecified"}.`, response.status);
    }
    const content = await response.text();
    if (!content.trim()) return report("EMPTY", "Source returned an empty document.", response.status);
    const contentHash = hash(content);
    if (request.knownContentHashes.includes(contentHash)) return report("DUPLICATE", "Source content matches a previously captured document.", response.status, null, contentHash);
    if (request.previousContentHash && request.previousContentHash !== contentHash) return report("CHANGED", "Source content differs from the prior document version.", response.status, null, contentHash);
    return report("CAPTURED", "Source document captured; it remains evidence pending governed admission.", response.status, null, contentHash);
  },
};
