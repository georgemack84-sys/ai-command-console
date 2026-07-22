import {
  getPlatformAssuranceBundle,
  runPlatformAssurance,
  validatePlatformAssurance,
} from "@/services/caf-platform-assurance";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { PlatformAssuranceInput, PlatformAssuranceResult } from "@/types/caf-platform-assurance";

export async function requirePlatformAssuranceUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): PlatformAssuranceInput { return body as PlatformAssuranceInput; }
function resultFromBody(body: Record<string, unknown>): PlatformAssuranceResult { return (body.result as PlatformAssuranceResult | undefined) ?? runPlatformAssurance(inputFromBody(body)); }

export function contractResponse() { return getPlatformAssuranceBundle(); }
export async function validateRequest(request: Request) { return validatePlatformAssurance(resultFromBody(await readBody(request))); }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlatformAssurance(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
export async function packageRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlatformAssurance(); return { assurance_package: result.assurance_package, evidence_correlation: result.evidence_correlation }; }
export async function dependenciesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlatformAssurance(); return { dependency_report: result.dependency_report }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlatformAssurance(); return { governance_report: result.governance_report }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlatformAssurance(); return { evidence_report: result.evidence_report, qualification_evidence: result.qualification_evidence }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlatformAssurance(); return { replay_findings: result.replay_findings }; }
export async function decisionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlatformAssurance(); return { assurance_decision: result.assurance_decision }; }
export async function reportRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlatformAssurance(); return { assurance_report: result.assurance_report }; }
