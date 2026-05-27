import { appendSamAuditEvent } from "./samAudit";
import { measureSamAsyncDuration } from "./performance/samLatencyTracker";

const samAuditDeduplication = new Set<string>();

function makeAuditDeduplicationKey({
  tenantId,
  executionId,
  idempotencyKey,
  type,
}: {
  tenantId?: string;
  executionId: string;
  attemptId: string;
  idempotencyKey: string;
  type: string;
}) {
  return `${tenantId || "__global__"}::${executionId}::${idempotencyKey}::${type}`;
}

export function clearSamAuditDeduplicationState() {
  samAuditDeduplication.clear();
}

export async function appendDeduplicatedSamAuditEvent({
  attemptId,
  idempotencyKey,
  ...input
}: {
  db?: unknown;
  type: string;
  proposalId: string;
  executionId: string;
  tenantId?: string;
  workspaceId?: string;
  attemptId: string;
  idempotencyKey: string;
  actor?: string;
  payload?: Record<string, unknown>;
}) {
  return measureSamAsyncDuration("sam.audit.dedupe.duration", async () => {
    const dedupeKey = makeAuditDeduplicationKey({
      tenantId: input.tenantId,
      executionId: input.executionId,
      attemptId,
      idempotencyKey,
      type: input.type,
    });

    if (samAuditDeduplication.has(dedupeKey)) {
      return {
        attempted: true,
        appended: false,
        skipped: true,
        reason: "SAM_DUPLICATE_AUDIT_SUPPRESSED",
      };
    }

    const result = await appendSamAuditEvent({
      ...input,
      tenantContext: input.tenantId
        ? {
            tenantId: input.tenantId,
            workspaceId: input.workspaceId || input.tenantId,
            source: "system",
            isolationVersion: "3.6G",
          }
        : undefined,
      payload: {
        ...(input.payload || {}),
        attemptId,
        idempotencyKey,
      },
    });

    if (result.appended) {
      samAuditDeduplication.add(dedupeKey);
    }
    return result;
  });
}
