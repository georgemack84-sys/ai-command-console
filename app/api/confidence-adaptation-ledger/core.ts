import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  getConfidenceAdaptationLedgerFoundation,
  recordConfidenceAdaptationLedger,
  replayConfidenceAdaptationLedger,
} from "@/services/confidence-adaptation-ledger";
import type { ConfidenceAdaptationLedgerInput, ConfidenceAdaptationLedgerResult } from "@/types/confidence-adaptation-ledger";

export async function requireConfidenceAdaptationLedgerUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getConfidenceAdaptationLedgerFoundation();
}

export async function analyzeRequest(request: Request) {
  const body = await readBody(request) as ConfidenceAdaptationLedgerInput;
  return recordConfidenceAdaptationLedger(body);
}

export async function recordsRequest(request: Request) {
  const body = await readBody(request) as ConfidenceAdaptationLedgerInput;
  return recordConfidenceAdaptationLedger(body).ledger_records;
}

export async function proposalHistoryRequest(request: Request) {
  const body = await readBody(request) as ConfidenceAdaptationLedgerInput;
  const result = recordConfidenceAdaptationLedger(body);
  return result.ledger_records.map((record) => ({
    proposal_id: record.proposal_id,
    proposal_version: record.proposal_version,
    ledger_event_type: record.ledger_event_type,
    certification_status: record.certification_status,
  }));
}

export async function governanceRequest(request: Request) {
  const body = await readBody(request) as ConfidenceAdaptationLedgerInput;
  return recordConfidenceAdaptationLedger(body).ledger_records.map((record) => ({
    ledger_record_id: record.ledger_record_id,
    governance_status: record.governance_status,
    governance_refs: record.governance_refs,
  }));
}

export async function simulationRequest(request: Request) {
  const body = await readBody(request) as ConfidenceAdaptationLedgerInput;
  const result = recordConfidenceAdaptationLedger(body);
  return {
    ledger_records: result.ledger_records.map((record) => ({ ledger_record_id: record.ledger_record_id, simulation_status: record.simulation_status })),
    certification_simulation_result: result.certification_record.simulation_result,
  };
}

export async function lineageRequest(request: Request) {
  const body = await readBody(request) as ConfidenceAdaptationLedgerInput;
  return recordConfidenceAdaptationLedger(body).calibration_lineage;
}

export async function replayLineageRequest(request: Request) {
  const body = await readBody(request) as ConfidenceAdaptationLedgerInput;
  return recordConfidenceAdaptationLedger(body).replay_record;
}

export async function certificationRequest(request: Request) {
  const body = await readBody(request) as ConfidenceAdaptationLedgerInput;
  return recordConfidenceAdaptationLedger(body).certification_record;
}

export async function rollbackRequest(request: Request) {
  const body = await readBody(request) as ConfidenceAdaptationLedgerInput;
  return recordConfidenceAdaptationLedger(body).rollback_record;
}

export async function patternsRequest(request: Request) {
  const body = await readBody(request) as ConfidenceAdaptationLedgerInput;
  const result = recordConfidenceAdaptationLedger(body);
  return {
    preserved_patterns: result.registry.preserved_patterns,
    pattern_index: result.registry.pattern_index,
  };
}

export async function registryRequest(request: Request) {
  const body = await readBody(request) as ConfidenceAdaptationLedgerInput;
  return recordConfidenceAdaptationLedger(body).registry;
}

export async function verifyRequest(request: Request) {
  const body = await readBody(request) as ConfidenceAdaptationLedgerInput;
  return recordConfidenceAdaptationLedger(body).validation;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<ConfidenceAdaptationLedgerResult> & ConfidenceAdaptationLedgerInput;
  const result = body.registry ? body as ConfidenceAdaptationLedgerResult : recordConfidenceAdaptationLedger(body);
  return {
    replay_valid: replayConfidenceAdaptationLedger(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    replay_refs: result.ledger_records.flatMap((record) => record.replay_refs),
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getConfidenceAdaptationLedgerFoundation();
  const body = await readBody(request) as ConfidenceAdaptationLedgerInput;
  const result = recordConfidenceAdaptationLedger(body);
  return {
    state: result.validation.state,
    verified: result.validation.verified,
    failures: result.validation.failures,
    record_count: result.ledger_records.length,
    append_only: result.append_only,
    immutable: result.immutable,
    audit_ready: result.audit_ready,
    modifies_production_confidence: result.modifies_production_confidence,
    updates_confidence_model: result.updates_confidence_model,
  };
}
