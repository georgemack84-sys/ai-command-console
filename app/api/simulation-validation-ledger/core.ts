import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  appendSimulationValidationLedgerRecord,
  getSimulationValidationLedgerFoundation,
  replaySimulationValidationLedger,
} from "@/services/simulation-validation-ledger";
import type { SimulationValidationLedgerInput, SimulationValidationLedgerResult } from "@/types/simulation-validation-ledger";

export async function requireSimulationValidationLedgerUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getSimulationValidationLedgerFoundation();
}

export async function appendRequest(request: Request) {
  const body = await readBody(request) as SimulationValidationLedgerInput;
  return appendSimulationValidationLedgerRecord(body);
}

export async function verifyRequest(request: Request) {
  const body = await readBody(request) as Partial<SimulationValidationLedgerResult> & SimulationValidationLedgerInput;
  const result = body.record && body.metrics ? body as SimulationValidationLedgerResult : appendSimulationValidationLedgerRecord(body);
  return {
    replay_valid: replaySimulationValidationLedger(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    ledger_status: result.ledger_status,
  };
}

export async function replayLookupRequest(request: Request) {
  const body = await readBody(request) as SimulationValidationLedgerInput;
  const result = appendSimulationValidationLedgerRecord(body);
  return { replay_hash: result.record.replay_hash, replay_inputs: result.record.replay_inputs, replay_outputs: result.record.replay_outputs };
}

export async function proposalLookupRequest(request: Request) {
  const body = await readBody(request) as SimulationValidationLedgerInput;
  const result = appendSimulationValidationLedgerRecord(body);
  return { proposal_id: result.record.proposal_id, proposal_lineage_complete: result.metrics.proposal_lineage_complete };
}

export async function simulationLookupRequest(request: Request) {
  const body = await readBody(request) as SimulationValidationLedgerInput;
  const result = appendSimulationValidationLedgerRecord(body);
  return { simulation_id: result.record.simulation_id, simulation_configuration: result.record.simulation_configuration };
}

export async function divergenceLookupRequest(request: Request) {
  const body = await readBody(request) as SimulationValidationLedgerInput;
  const result = appendSimulationValidationLedgerRecord(body);
  return { divergence_analysis: result.record.divergence_analysis, divergence_records: result.divergence_result.records };
}

export async function certificationLookupRequest(request: Request) {
  const body = await readBody(request) as SimulationValidationLedgerInput;
  const result = appendSimulationValidationLedgerRecord(body);
  return { certification_recommendation: result.record.certification_recommendation, ledger_status: result.ledger_status };
}

export async function auditRequest(request: Request) {
  const body = await readBody(request) as SimulationValidationLedgerInput;
  const result = appendSimulationValidationLedgerRecord(body);
  return result.evidence_package;
}

export async function lineageRequest(request: Request) {
  const body = await readBody(request) as SimulationValidationLedgerInput;
  const result = appendSimulationValidationLedgerRecord(body);
  return {
    previous_record_hash: result.record.previous_record_hash,
    ledger_sequence: result.record.ledger_sequence,
    lineage_verification_report_hash: result.evidence_package.lineage_verification_report_hash,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getSimulationValidationLedgerFoundation();
  const body = await readBody(request) as SimulationValidationLedgerInput;
  const result = appendSimulationValidationLedgerRecord(body);
  return {
    ledger_status: result.ledger_status,
    failures: result.failures,
    records_committed: result.metrics.records_committed,
    append_only: result.append_only,
    immutable: result.immutable,
    replayable: result.replayable,
    tenant_isolated: result.tenant_isolated,
    cryptographically_verifiable: result.cryptographically_verifiable,
    fully_auditable: result.fully_auditable,
    update_supported: result.update_supported,
    delete_supported: result.delete_supported,
    cross_tenant_access_supported: result.cross_tenant_access_supported,
  };
}
