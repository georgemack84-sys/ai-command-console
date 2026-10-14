import { z } from "zod";
import { AppError } from "@/src/server/api/errors";

const boundedHeader = z.string().trim().min(8).max(256);

export const sandboxEvidenceRequestSchema = z.object({
  query: z.string().trim().min(3).max(240),
  resource: z.string().trim().min(1).max(120),
}).strict();

export const sandboxHeadlineRequestSchema = z.object({
  evidence: z.object({
    query: z.string().trim().min(3).max(240),
    resource: z.string().trim().min(1).max(120),
    items: z.array(z.object({ title: z.string().trim().min(1).max(240), summary: z.string().trim().min(1).max(1_000) }).strict()).min(1).max(5),
  }).strict(),
}).strict();

export type SandboxRequestHeaders = { authorization: string | null; correlationId: string | null; idempotencyKey: string | null };

/** Validates transport requirements shared by every sandbox capability. */
export function parseSandboxRequestHeaders(headers: SandboxRequestHeaders) {
  const correlationId = boundedHeader.parse(headers.correlationId);
  const idempotencyKey = boundedHeader.parse(headers.idempotencyKey);
  const authorization = headers.authorization?.trim() ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  if (!match?.[1]?.trim()) {
    throw new AppError(401, "sandbox_bearer_required", "A sandbox service credential must be provided as a Bearer token.");
  }
  return { credential: match[1].trim(), correlationId, idempotencyKey };
}

/**
 * Sandbox payloads intentionally contain no tenant data. They let adapters
 * prove request shaping, authorization, correlation, and idempotency handling
 * without treating a local fixture as Nuru research.
 */
export function createSyntheticEvidence(input: z.infer<typeof sandboxEvidenceRequestSchema>) {
  return {
    mode: "sandbox_fixture" as const,
    query: input.query,
    resource: input.resource,
    items: [{
      title: `Sandbox evidence for ${input.query}`,
      summary: "Synthetic sandbox evidence. It is not retrieved from Nuru, an external source, or a production workspace.",
    }],
  };
}

export function createSandboxHeadline(input: z.infer<typeof sandboxHeadlineRequestSchema>) {
  const evidence = input.evidence.items[0];
  return {
    mode: "sandbox_fixture" as const,
    draft: evidence.title.replace(/^Sandbox evidence for\s+/i, "") || evidence.title,
    evidenceCount: input.evidence.items.length,
    notice: "Synthetic sandbox draft only. No headline was published.",
  };
}
