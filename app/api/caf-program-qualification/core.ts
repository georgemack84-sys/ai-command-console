import {
  getProgramQualificationBundle,
  runProgramQualification,
  validateProgramQualification,
} from "@/services/caf-program-qualification";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ProgramQualificationInput, ProgramQualificationResult } from "@/types/caf-program-qualification";

export async function requireProgramQualificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ProgramQualificationInput { return body as ProgramQualificationInput; }
function resultFromBody(body: Record<string, unknown>): ProgramQualificationResult { return (body.result as ProgramQualificationResult | undefined) ?? runProgramQualification(inputFromBody(body)); }

export function contractResponse() { return getProgramQualificationBundle(); }
export async function validateRequest(request: Request) { return validateProgramQualification(resultFromBody(await readBody(request))); }
export async function frameworkRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProgramQualification(); return { framework: result.framework }; }
export async function constitutionalRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProgramQualification(); return { constitutional_review: result.constitutional_review }; }
export async function architectureRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProgramQualification(); return { architecture_review: result.architecture_review }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProgramQualification(); return { governance_review: result.governance_review }; }
export async function authorityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProgramQualification(); return { authority_review: result.authority_review }; }
export async function policyRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProgramQualification(); return { policy_review: result.policy_review }; }
export async function safetyRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProgramQualification(); return { safety_review: result.safety_review }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProgramQualification(); return { replay_review: result.replay_review }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProgramQualification(); return { evidence_review: result.evidence_review, evidence_ledger: result.evidence_ledger }; }
export async function interoperabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProgramQualification(); return { interoperability_review: result.interoperability_review }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProgramQualification(); return { readiness: result.readiness }; }
export async function maturityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProgramQualification(); return { maturity: result.maturity }; }
export async function decisionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProgramQualification(); return { report: result.report, decision: result.decision, integrity_hash: result.integrity_hash }; }
