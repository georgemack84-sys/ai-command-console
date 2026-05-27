import type { SamStoredIdempotencyResult } from "./samIdempotencyTypes";
import { getSamChaosFailureInjectionMode, onSamChaosStoreRead, onSamChaosStoreWrite } from "./chaos/samFailureInjection";
import { measureSamSyncDuration } from "./performance/samLatencyTracker";

const samIdempotencyByKey = new Map<string, SamStoredIdempotencyResult>();
const samIdempotencyByAttempt = new Map<string, SamStoredIdempotencyResult>();

function scopedKey(key: string, tenantId?: string) {
  return `${String(tenantId || "__global__").trim()}::${String(key || "").trim()}`;
}

function cloneRecord(record: SamStoredIdempotencyResult | undefined | null): SamStoredIdempotencyResult | undefined {
  return record ? { ...record } : undefined;
}

export function clearSamIdempotencyStore() {
  samIdempotencyByKey.clear();
  samIdempotencyByAttempt.clear();
}

export function getSamIdempotencyByKey(
  idempotencyKey: string,
  scope?: { tenantId?: string },
): SamStoredIdempotencyResult | undefined {
  return measureSamSyncDuration("sam.idempotency.lookup.duration", () => {
    onSamChaosStoreRead();
    const record = cloneRecord(samIdempotencyByKey.get(scopedKey(idempotencyKey, scope?.tenantId)));
    const mode = getSamChaosFailureInjectionMode();
    if (!record || !mode?.corruptReadMode) {
      return record;
    }
    if (mode.corruptReadMode === "proposal_hash_mismatch") {
      return {
        ...record,
        proposalHash: "corrupted_proposal_hash",
      };
    }
    if (mode.corruptReadMode === "ambiguous") {
      return {
        ...record,
        status: "ambiguous",
      };
    }
    if (mode.corruptReadMode === "pending") {
      return {
        ...record,
        status: "pending",
      };
    }
    return record;
  });
}

export function getSamIdempotencyByAttemptId(
  attemptId: string,
  scope?: { tenantId?: string },
): SamStoredIdempotencyResult | undefined {
  return measureSamSyncDuration("sam.idempotency.lookup.duration", () => {
    onSamChaosStoreRead();
    return cloneRecord(samIdempotencyByAttempt.get(scopedKey(attemptId, scope?.tenantId)));
  });
}

export function storeSamIdempotencyResult(record: SamStoredIdempotencyResult) {
  return measureSamSyncDuration("sam.idempotency.write.duration", () => {
    onSamChaosStoreWrite();
    const normalized: SamStoredIdempotencyResult = {
      ...record,
      createdAt: record.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    samIdempotencyByKey.set(scopedKey(normalized.idempotencyKey, normalized.tenantId), normalized);
    samIdempotencyByAttempt.set(scopedKey(normalized.attemptId, normalized.tenantId), normalized);
    return cloneRecord(normalized)!;
  });
}
