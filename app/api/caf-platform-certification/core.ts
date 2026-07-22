import {
  getPlatformCertificationBundle,
  runPlatformCertification,
  validatePlatformCertification,
} from "@/services/caf-platform-certification";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { PlatformCertificationInput, PlatformCertificationResult } from "@/types/caf-platform-certification";

export async function requirePlatformCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): PlatformCertificationInput { return body as PlatformCertificationInput; }
function resultFromBody(body: Record<string, unknown>): PlatformCertificationResult { return (body.result as PlatformCertificationResult | undefined) ?? runPlatformCertification(inputFromBody(body)); }

export function contractResponse() { return getPlatformCertificationBundle(); }
export async function validateRequest(request: Request) { return validatePlatformCertification(resultFromBody(await readBody(request))); }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlatformCertification(); return { certification_gate: result.certification_gate, certificate: result.certificate, integrity_hash: result.integrity_hash }; }
export async function eligibilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlatformCertification(); return { eligibility: result.eligibility }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlatformCertification(); return { evidence_package: result.evidence_package }; }
export async function decisionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlatformCertification(); return { decision: result.decision }; }
export async function certificateRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlatformCertification(); return { certificate: result.certificate, consumer_access: result.consumer_access }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlatformCertification(); return { ledger: result.ledger }; }
export async function lifecycleRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlatformCertification(); return { lifecycle: result.lifecycle }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlatformCertification(); return { governance: result.governance, observability: result.observability }; }
export async function auditRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlatformCertification(); return { audit_lineage: result.audit_lineage }; }
