import { getReleaseArtifactBuildIntegrityBundle, runReleaseArtifactBuildIntegrity, validateReleaseArtifactBuildIntegrity } from "@/services/release-artifact-build-integrity";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ReleaseArtifactBuildIntegrityResult, ReleaseArtifactInput } from "@/types/release-artifact-build-integrity";

export async function requireReleaseArtifactBuildIntegrityUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ReleaseArtifactInput { return body as ReleaseArtifactInput; }
function resultFromBody(body: Record<string, unknown>): ReleaseArtifactBuildIntegrityResult { return (body.result as ReleaseArtifactBuildIntegrityResult | undefined) ?? runReleaseArtifactBuildIntegrity(inputFromBody(body)); }

export function contractResponse() { return getReleaseArtifactBuildIntegrityBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runReleaseArtifactBuildIntegrity(); }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runReleaseArtifactBuildIntegrity(); return { artifact_identity: result.artifact_identity, registry: result.registry }; }
export async function manifestRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runReleaseArtifactBuildIntegrity(); return { build_manifest: result.build_manifest }; }
export async function integrityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runReleaseArtifactBuildIntegrity(); return { integrity_record: result.integrity_record, signature: result.signature, attestation: result.attestation }; }
export async function sbomRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runReleaseArtifactBuildIntegrity(); return { sbom: result.sbom }; }
export async function provenanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runReleaseArtifactBuildIntegrity(); return { provenance: result.provenance, reproducible_build: result.reproducible_build }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runReleaseArtifactBuildIntegrity(); return { certification_binding: result.certification_binding, certification_record: result.certification_record, certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateReleaseArtifactBuildIntegrity(resultFromBody(await readBody(request))); }
