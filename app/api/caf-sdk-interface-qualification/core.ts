import {
  getSdkInterfaceQualificationBundle,
  runSdkInterfaceQualification,
  validateSdkInterfaceQualification,
} from "@/services/caf-sdk-interface-qualification";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { SdkInterfaceQualificationInput, SdkInterfaceQualificationResult } from "@/types/caf-sdk-interface-qualification";

export async function requireSdkInterfaceQualificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): SdkInterfaceQualificationInput { return body as SdkInterfaceQualificationInput; }
function resultFromBody(body: Record<string, unknown>): SdkInterfaceQualificationResult { return (body.result as SdkInterfaceQualificationResult | undefined) ?? runSdkInterfaceQualification(inputFromBody(body)); }

export function contractResponse() { return getSdkInterfaceQualificationBundle(); }
export async function validateRequest(request: Request) { return validateSdkInterfaceQualification(resultFromBody(await readBody(request))); }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSdkInterfaceQualification(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
export async function sdkRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSdkInterfaceQualification(); return { sdk_validation: result.sdk_validation, certified_sdk_manifest: result.certified_sdk_manifest }; }
export async function apiRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSdkInterfaceQualification(); return { api_validation: result.api_validation }; }
export async function compatibilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSdkInterfaceQualification(); return { compatibility: result.compatibility }; }
export async function interfacesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSdkInterfaceQualification(); return { interface_certification: result.interface_certification }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSdkInterfaceQualification(); return { qualification_evidence: result.qualification_evidence }; }
export async function reportsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSdkInterfaceQualification(); return { interface_report: result.interface_report }; }
