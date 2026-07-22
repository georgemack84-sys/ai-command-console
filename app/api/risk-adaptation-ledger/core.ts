import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { analyzeRiskAdaptationLedger, getRiskAdaptationLedgerFoundation, replayRiskAdaptationLedger } from "@/services/risk-adaptation-ledger";
import type { RiskAdaptationLedgerInput, RiskAdaptationLedgerResult } from "@/types/risk-adaptation-ledger";

export async function requireRiskAdaptationLedgerUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getRiskAdaptationLedgerFoundation();
}

export async function commitRequest(request: Request) {
  const body = await readBody(request) as RiskAdaptationLedgerInput;
  return analyzeRiskAdaptationLedger(body);
}

export async function entriesRequest(request: Request) {
  const body = await readBody(request) as RiskAdaptationLedgerInput;
  return analyzeRiskAdaptationLedger(body).entries;
}

export async function proposalsRequest(request: Request) {
  const body = await readBody(request) as RiskAdaptationLedgerInput;
  return analyzeRiskAdaptationLedger(body).proposal_registry;
}

export async function governanceRequest(request: Request) {
  const body = await readBody(request) as RiskAdaptationLedgerInput;
  return analyzeRiskAdaptationLedger(body).governance_registry;
}

export async function simulationsRequest(request: Request) {
  const body = await readBody(request) as RiskAdaptationLedgerInput;
  return analyzeRiskAdaptationLedger(body).simulation_registry;
}

export async function operatorDecisionsRequest(request: Request) {
  const body = await readBody(request) as RiskAdaptationLedgerInput;
  return analyzeRiskAdaptationLedger(body).operator_registry;
}

export async function certificationsRequest(request: Request) {
  const body = await readBody(request) as RiskAdaptationLedgerInput;
  return analyzeRiskAdaptationLedger(body).certification_registry;
}

export async function lineageRequest(request: Request) {
  const body = await readBody(request) as RiskAdaptationLedgerInput;
  return analyzeRiskAdaptationLedger(body).lineage_registry;
}

export async function integrityRequest(request: Request) {
  const body = await readBody(request) as RiskAdaptationLedgerInput;
  return analyzeRiskAdaptationLedger(body).integrity_report;
}

export async function validationRequest(request: Request) {
  const body = await readBody(request) as RiskAdaptationLedgerInput;
  return analyzeRiskAdaptationLedger(body).validation;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<RiskAdaptationLedgerResult> & RiskAdaptationLedgerInput;
  const result = body.entries ? body as RiskAdaptationLedgerResult : analyzeRiskAdaptationLedger(body);
  return {
    replay_valid: replayRiskAdaptationLedger(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    replay_refs: result.entries.map((entry) => entry.replay_lineage_ref).filter(Boolean),
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getRiskAdaptationLedgerFoundation();
  const body = await readBody(request) as RiskAdaptationLedgerInput;
  const result = analyzeRiskAdaptationLedger(body);
  return {
    state: result.validation.state,
    certified: result.validation.certified,
    failures: result.validation.failures,
    entry_type: result.entries[0]?.entry_type,
    append_only: result.append_only,
    immutable: result.immutable,
    audit_ready: result.audit_ready,
    hash_verified: result.validation.hash_verified,
    chain_continuity_verified: result.validation.chain_continuity_verified,
  };
}
