import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  getProposalValidationFoundation,
  replayProposalValidation,
  validateProposalIntegrity,
} from "@/services/proposal-validation-integrity-engine";
import type { ProposalValidationInput, ProposalValidationResult } from "@/types/proposal-validation-integrity-engine";

export async function requireProposalValidationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getProposalValidationFoundation();
}

export async function validateRequest(request: Request) {
  const body = await readBody(request) as ProposalValidationInput;
  return validateProposalIntegrity(body);
}

export async function reportsRequest(request: Request) {
  const body = await readBody(request) as ProposalValidationInput;
  return validateProposalIntegrity(body).validation_reports;
}

export async function checksRequest(request: Request) {
  const body = await readBody(request) as ProposalValidationInput;
  return validateProposalIntegrity(body).validation_reports.flatMap((report) => report.completed_checks);
}

export async function metricsRequest(request: Request) {
  const body = await readBody(request) as ProposalValidationInput;
  return validateProposalIntegrity(body).metrics;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<ProposalValidationResult> & ProposalValidationInput;
  const result = body.validation_reports && body.metrics ? body as ProposalValidationResult : validateProposalIntegrity(body);
  return {
    replay_valid: replayProposalValidation(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    validation_state: result.validation_state,
    validation_outcome: result.validation_outcome,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getProposalValidationFoundation();
  const body = await readBody(request) as ProposalValidationInput;
  const result = validateProposalIntegrity(body);
  return {
    validation_state: result.validation_state,
    validation_outcome: result.validation_outcome,
    failures: result.failures,
    reports: result.validation_reports.length,
    replayable: result.replayable,
    tenant_isolated: result.tenant_isolated,
    proposal_contents_unchanged: result.proposal_contents_unchanged,
    advisory_only: result.advisory_only,
    modifies_proposals: result.modifies_proposals,
    authorizes_implementation: result.authorizes_implementation,
  };
}
