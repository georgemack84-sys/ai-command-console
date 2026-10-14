import { createHash } from "node:crypto";
import { z } from "zod";
import { AppError, isAppError } from "@/src/server/api/errors";
import { NuruSearchService } from "@/src/server/services/nuru-search-service";

const identifier = z.string().trim().min(8).max(128);

export const nuruWorkflowEvidenceRequestSchema = z.object({
  correlationId: identifier,
  idempotencyKey: identifier,
  query: z.string().trim().min(3).max(240),
  resource: z.string().trim().min(1).max(120),
}).strict();

export type NuruWorkflowEvidenceRequest = z.infer<typeof nuruWorkflowEvidenceRequestSchema>;

type EvidenceResponse = {
  evidence: Array<{ id: string; title: string; contentType: string; project: string | null; confidence: number; retrievedAt: string }>;
  audit: { correlationId: string; idempotencyKey: string; resource: string; operation: "evidence.retrieve" };
};

type ReplayEntry = { fingerprint: string; response: EvidenceResponse; expiresAt: number };
const replayTtlMs = 10 * 60 * 1_000;
const maxReplayEntries = 1_000;
const replayEntries = new Map<string, ReplayEntry>();

function fingerprint(input: NuruWorkflowEvidenceRequest) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function pruneReplayEntries(now: number) {
  for (const [key, entry] of replayEntries) {
    if (entry.expiresAt <= now) replayEntries.delete(key);
  }
  while (replayEntries.size >= maxReplayEntries) {
    const key = replayEntries.keys().next().value;
    if (!key) break;
    replayEntries.delete(key);
  }
}

async function withinEvidenceTimeout<T>(work: Promise<T>) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new AppError(504, "evidence_retrieval_timeout", "Nuru evidence retrieval exceeded the 30-second contract timeout.")), 30_000);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/**
 * Reads only canonical Nuru knowledge. This contract deliberately has no
 * persistence dependency: replay data is bounded process memory, and no Nuru
 * knowledge, candidate, audit, or workflow record is created by a request.
 */
export async function retrieveNuruWorkflowEvidence(rawInput: unknown, identity: { workspaceId: string; principalId: string }) {
  const input = nuruWorkflowEvidenceRequestSchema.parse(rawInput);
  const replayKey = `${identity.workspaceId}:${identity.principalId}:${input.idempotencyKey}`;
  const inputFingerprint = fingerprint(input);
  const now = Date.now();
  pruneReplayEntries(now);
  const existing = replayEntries.get(replayKey);
  if (existing) {
    if (existing.fingerprint !== inputFingerprint) throw new AppError(409, "idempotency_conflict", "This idempotency key was already used with a different request.");
    return { ...existing.response, replayed: true as const };
  }

  try {
    const results = await withinEvidenceTimeout(NuruSearchService.search({ query: input.query, limit: 10, metadata: {} }));
    const response: EvidenceResponse = {
      evidence: results.map((item) => ({
        id: item.id,
        title: item.title,
        contentType: item.contentType,
        project: item.project,
        confidence: item.confidence,
        retrievedAt: item.createdAt.toISOString(),
      })),
      audit: { correlationId: input.correlationId, idempotencyKey: input.idempotencyKey, resource: input.resource, operation: "evidence.retrieve" },
    };
    replayEntries.set(replayKey, { fingerprint: inputFingerprint, response, expiresAt: now + replayTtlMs });
    return { ...response, replayed: false as const };
  } catch (error) {
    if (isAppError(error)) throw error;
    throw new AppError(503, "evidence_retrieval_unavailable", "Nuru evidence retrieval is temporarily unavailable. Retry with the same idempotency key.");
  }
}

export function validateNuruWorkflowEvidenceHeaders(headers: { authorization: string | null; correlationId: string | null; idempotencyKey: string | null }) {
  const correlationId = identifier.parse(headers.correlationId);
  const idempotencyKey = identifier.parse(headers.idempotencyKey);
  const authorization = headers.authorization?.trim() ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  if (!match?.[1]?.trim()) throw new AppError(401, "bearer_required", "A Nuru workflow service credential must be provided as a Bearer token.");
  return { credential: match[1].trim(), correlationId, idempotencyKey };
}

export function assertNuruWorkflowEvidenceCorrelation(input: NuruWorkflowEvidenceRequest, headers: { correlationId: string; idempotencyKey: string }) {
  if (input.correlationId !== headers.correlationId) throw new AppError(400, "correlation_mismatch", "The request correlation ID must match the X-Correlation-ID header.");
  if (input.idempotencyKey !== headers.idempotencyKey) throw new AppError(400, "idempotency_mismatch", "The request idempotency key must match the Idempotency-Key header.");
}

export function getNuruWorkflowHealth() {
  return { service: "nuru", contract: "nuru.workflow.evidence", version: "1", status: "ready" as const, mode: "read_only", operations: ["evidence.retrieve"] };
}
