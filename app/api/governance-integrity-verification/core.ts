import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildGovernanceIntegrityVerificationObservabilitySurface,
  classifyGovernanceIntegrityVerificationFailure,
  getGovernanceIntegrityVerificationContract,
  runGovernanceIntegrityVerification,
} from "@/services/governance-integrity-verification";
import type {
  GovernanceIntegrityVerificationFailure,
  GovernanceIntegrityVerificationInput,
  GovernanceIntegrityVerificationReport,
} from "@/types/governance-integrity-verification";

export async function requireGovernanceIntegrityVerificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): GovernanceIntegrityVerificationInput {
  return body as GovernanceIntegrityVerificationInput;
}

function reportFromBody(body: Record<string, unknown>): GovernanceIntegrityVerificationReport {
  return (body.report as GovernanceIntegrityVerificationReport | undefined) ?? runGovernanceIntegrityVerification(inputFromBody(body));
}

export function getGovernanceIntegrityVerificationContractResponse() {
  return getGovernanceIntegrityVerificationContract();
}

export async function runGovernanceIntegrityVerificationRequest(request: Request) {
  return runGovernanceIntegrityVerification(inputFromBody(await readBody(request)));
}

export async function validateGovernanceIntegrityVerificationRequest(request: Request) {
  const report = reportFromBody(await readBody(request));
  return {
    verification_id: report.verification_id,
    integrity_state: report.integrity_state,
    downstream_trust_allowed: report.downstream_trust_allowed,
    certification_ready: report.certification_ready,
    failures: report.failure_details,
    truth_ledger_record_id: report.truth_ledger_record.verification_record_id,
    report_hash: report.report_hash,
  };
}

export async function classifyGovernanceIntegrityVerificationRequest(request: Request) {
  const body = await readBody(request);
  return {
    failure: body.failure as GovernanceIntegrityVerificationFailure,
    integrity_state: classifyGovernanceIntegrityVerificationFailure(body.failure as GovernanceIntegrityVerificationFailure),
  };
}

export async function evidenceGovernanceIntegrityVerificationRequest(request: Request) {
  return reportFromBody(await readBody(request)).supporting_evidence;
}

export async function ledgerGovernanceIntegrityVerificationRequest(request: Request) {
  return reportFromBody(await readBody(request)).truth_ledger_record;
}

export async function resultsGovernanceIntegrityVerificationRequest(request: Request) {
  return reportFromBody(await readBody(request)).verification_results;
}

export async function inspectGovernanceIntegrityVerificationRequest(request?: Request) {
  if (!request) return buildGovernanceIntegrityVerificationObservabilitySurface();
  return buildGovernanceIntegrityVerificationObservabilitySurface(inputFromBody(await readBody(request)));
}
