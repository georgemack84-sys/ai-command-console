import { getPolicySetManifestImmutableBindingContract, runPolicySetManifestImmutableBinding, validatePolicySetManifestImmutableBinding } from "@/services/policy-set-manifest-immutable-binding";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { PolicyManifestInput, PolicyManifestResult } from "@/types/policy-set-manifest-immutable-binding";

export async function requirePolicyManifestUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): PolicyManifestInput { return body as PolicyManifestInput; }
function resultFromBody(body: Record<string, unknown>): PolicyManifestResult { return (body.result as PolicyManifestResult | undefined) ?? runPolicySetManifestImmutableBinding(inputFromBody(body)); }

export function contractResponse() { return getPolicySetManifestImmutableBindingContract(); }
export async function manifestRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPolicySetManifestImmutableBinding(); return { manifest: result.manifest, policy_registry: result.policy_registry, required_policy_matrix: result.required_policy_matrix, dependency_resolution: result.dependency_resolution, compatibility_report: result.compatibility_report }; }
export async function bindingRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPolicySetManifestImmutableBinding(); return { binding: result.binding, version_history: result.version_history, audit_ledger: result.audit_ledger }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPolicySetManifestImmutableBinding(); return { replay_validation: result.replay_validation, replay_hash: result.replay_hash, valid: validatePolicySetManifestImmutableBinding(result).valid }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPolicySetManifestImmutableBinding(); return { certification: result.certification, governance_validation: result.governance_validation, integrity_hash: result.integrity_hash }; }
export async function validateRequest(request: Request) { return validatePolicySetManifestImmutableBinding(resultFromBody(await readBody(request))); }
export async function operationsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPolicySetManifestImmutableBinding(); return { observability: result.observability, audit_ledger: result.audit_ledger, certification_status: result.certification.status }; }
