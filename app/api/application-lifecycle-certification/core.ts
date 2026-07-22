import {
  getApplicationLifecycleCertificationBundle,
  runApplicationLifecycleCertification,
  validateApplicationLifecycleCertification,
} from "@/services/application-lifecycle-certification";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ApplicationLifecycleCertificationInput, ApplicationLifecycleCertificationResult } from "@/types/application-lifecycle-certification";

export async function requireApplicationLifecycleCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ApplicationLifecycleCertificationInput { return body as ApplicationLifecycleCertificationInput; }
function resultFromBody(body: Record<string, unknown>): ApplicationLifecycleCertificationResult { return (body.result as ApplicationLifecycleCertificationResult | undefined) ?? runApplicationLifecycleCertification(inputFromBody(body)); }

export function contractResponse() { return getApplicationLifecycleCertificationBundle(); }
export async function validateRequest(request: Request) { return validateApplicationLifecycleCertification(resultFromBody(await readBody(request))); }
export async function lifecycleRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationLifecycleCertification(); return { lifecycle_model: result.lifecycle_model, lifecycle_record: result.lifecycle_record }; }
export async function versionLineageRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationLifecycleCertification(); return { version_lineage: result.version_lineage }; }
export async function frameworkRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationLifecycleCertification(); return { certification_framework: result.certification_framework }; }
export async function executionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationLifecycleCertification(); return { certification_execution: result.certification_execution }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationLifecycleCertification(); return { certification_evidence: result.certification_evidence }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationLifecycleCertification(); return { certification_governance: result.certification_governance }; }
export async function tenantQualificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationLifecycleCertification(); return { tenant_qualification: result.tenant_qualification }; }
export async function statusRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationLifecycleCertification(); return { status_registry: result.status_registry }; }
export async function certificateRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationLifecycleCertification(); return { certificate: result.certificate }; }
export async function ledgersRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationLifecycleCertification(); return { ledgers: result.ledgers }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationLifecycleCertification(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
