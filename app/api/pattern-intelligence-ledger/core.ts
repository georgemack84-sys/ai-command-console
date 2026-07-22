import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  appendPatternIntelligenceLedger,
  computePatternLedgerRecordHash,
  getPatternIntelligenceLedgerFoundation,
  replayPatternIntelligenceLedger,
} from "@/services/pattern-intelligence-ledger";
import type { PatternLedgerInput, PatternLedgerResult } from "@/types/pattern-intelligence-ledger";

export async function requirePatternLedgerUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getPatternLedgerContractResponse() {
  return getPatternIntelligenceLedgerFoundation();
}

export async function appendPatternLedgerRequest(request: Request) {
  const body = await readBody(request) as PatternLedgerInput;
  return appendPatternIntelligenceLedger(body);
}

export async function retrievePatternLedgerRecordRequest(request: Request) {
  const body = await readBody(request) as PatternLedgerInput & { ledger_record_id?: string };
  const result = appendPatternIntelligenceLedger(body);
  const record = body.ledger_record_id
    ? result.ledger.records.find((ledgerRecord) => ledgerRecord.ledger_record_id === body.ledger_record_id)
    : result.ledger.records[0];
  return record ?? null;
}

export async function retrievePatternLedgerHistoryRequest(request: Request) {
  const body = await readBody(request) as PatternLedgerInput & { pattern_id?: string };
  const result = appendPatternIntelligenceLedger(body);
  return result.ledger.records.filter((record) => !body.pattern_id || record.pattern_id === body.pattern_id);
}

export async function queryPatternLedgerRequest(request: Request) {
  const body = await readBody(request) as PatternLedgerInput;
  const result = appendPatternIntelligenceLedger(body);
  return {
    ledger_id: result.ledger.ledger_id,
    tenant_id: result.ledger.tenant_id,
    record_refs: result.ledger.record_refs,
    append_only: result.ledger.append_only,
    immutable: result.ledger.immutable,
  };
}

export async function verifyPatternLedgerIntegrityRequest(request: Request) {
  const body = await readBody(request) as PatternLedgerInput;
  const result = appendPatternIntelligenceLedger(body);
  return {
    certified: result.validation.certified,
    integrity_verified: result.validation.integrity_verified,
    hash_chain_valid: result.validation.hash_chain_valid,
    append_ordering_valid: result.validation.append_ordering_valid,
    record_hashes: result.ledger.records.map((record) => ({
      ledger_record_id: record.ledger_record_id,
      integrity_hash: record.integrity_hash,
      computed_hash: computePatternLedgerRecordHash(record),
    })),
  };
}

export async function retrievePatternLedgerLineageRequest(request: Request) {
  const body = await readBody(request) as PatternLedgerInput;
  const result = appendPatternIntelligenceLedger(body);
  return result.lineage_registry;
}

export async function replayPatternLedgerRequest(request: Request) {
  const body = await readBody(request) as Partial<PatternLedgerResult> & PatternLedgerInput;
  const result = body.ledger ? body as PatternLedgerResult : appendPatternIntelligenceLedger(body);
  return {
    replay_valid: replayPatternIntelligenceLedger(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
  };
}

export async function inspectPatternLedgerRequest(request?: Request) {
  if (!request) return getPatternIntelligenceLedgerFoundation();
  const body = await readBody(request) as PatternLedgerInput;
  const result = appendPatternIntelligenceLedger(body);
  return {
    state: result.validation.state,
    certified: result.validation.certified,
    failures: result.validation.failures,
    records: result.ledger.records.length,
    append_only: result.append_only,
    immutable: result.immutable,
    advisory_only: result.advisory_only,
    autonomous_learning: result.autonomous_learning,
  };
}
