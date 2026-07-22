import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  certifyGovernanceAdaptationLayer,
  getGovernanceAdaptationCertificationGateFoundation,
  replayGovernanceAdaptationCertification,
} from "@/services/governance-adaptation-certification-gate";
import type { GovernanceAdaptationCertificationGateInput, GovernanceAdaptationCertificationGateResult } from "@/types/governance-adaptation-certification-gate";

export async function requireGovernanceAdaptationCertificationGateUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getGovernanceAdaptationCertificationGateFoundation();
}

export async function certifyRequest(request: Request) {
  const body = await readBody(request) as GovernanceAdaptationCertificationGateInput;
  return certifyGovernanceAdaptationLayer(body);
}

export async function matrixRequest(request: Request) {
  const body = await readBody(request) as GovernanceAdaptationCertificationGateInput;
  return certifyGovernanceAdaptationLayer(body).certification.certification_evidence;
}

export async function modulesRequest(request: Request) {
  const body = await readBody(request) as GovernanceAdaptationCertificationGateInput;
  return certifyGovernanceAdaptationLayer(body).certification.module_results;
}

export async function integrityRequest(request: Request) {
  const body = await readBody(request) as GovernanceAdaptationCertificationGateInput;
  const result = certifyGovernanceAdaptationLayer(body);
  return {
    integrity_verification_report: result.integrity_verification_report,
    integrity_hash: result.integrity_hash,
    certification_hash: result.certification.integrity_hash,
    failures: result.failures,
  };
}

export async function ledgerRequest(request: Request) {
  const body = await readBody(request) as GovernanceAdaptationCertificationGateInput;
  return certifyGovernanceAdaptationLayer(body).ledger_entry;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<GovernanceAdaptationCertificationGateResult> & GovernanceAdaptationCertificationGateInput;
  const result = body.certification && body.ledger_entry ? body as GovernanceAdaptationCertificationGateResult : certifyGovernanceAdaptationLayer(body);
  return {
    replay_valid: replayGovernanceAdaptationCertification(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    final_certification_decision: result.final_certification_decision,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getGovernanceAdaptationCertificationGateFoundation();
  const body = await readBody(request) as GovernanceAdaptationCertificationGateInput;
  const result = certifyGovernanceAdaptationLayer(body);
  return {
    outcome: result.final_certification_decision,
    tests: result.certification.certification_evidence.length,
    failed_tests: result.failures,
    pass: result.pass,
    conditional_pass: result.conditional_pass,
    fail: result.fail,
    production_safe: result.production_safe,
    replayable: result.replayable,
    audit_ready: result.audit_ready,
    advisory_only: result.advisory_only,
  };
}
