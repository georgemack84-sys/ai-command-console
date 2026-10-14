import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { AppError } from "@/src/server/api/errors";
import { prisma } from "@/src/server/db/prisma";

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonicalize(item)]));
  return value;
}

export function fingerprintSandboxInput(value: unknown) {
  return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

export async function persistSandboxReceipt(input: { workspaceId: string; applicationSlug: string; operation: string; idempotencyKey: string; correlationId: string; request: unknown; response: unknown }) {
  const inputFingerprint = fingerprintSandboxInput(input.request);
  const where = { workspaceId_applicationSlug_operation_idempotencyKey: { workspaceId: input.workspaceId, applicationSlug: input.applicationSlug, operation: input.operation, idempotencyKey: input.idempotencyKey } };
  const existing = await prisma.workflowSandboxReceipt.findUnique({ where });
  if (existing) {
    if (existing.inputFingerprint !== inputFingerprint) throw new AppError(409, "sandbox_idempotency_conflict", "This idempotency key was already used with a different sandbox request.");
    return { replayed: true as const, response: existing.responseSnapshot };
  }
  const receipt = await prisma.workflowSandboxReceipt.create({
    data: {
      workspaceId: input.workspaceId,
      applicationSlug: input.applicationSlug,
      operation: input.operation,
      idempotencyKey: input.idempotencyKey,
      correlationId: input.correlationId,
      inputFingerprint,
      responseSnapshot: input.response as Prisma.InputJsonValue,
    },
  });
  return { replayed: false as const, response: receipt.responseSnapshot };
}
