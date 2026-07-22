import { getPhase12CertificationGateContract, runPhase12CertificationGate, validatePhase12CertificationGate } from "@/services/phase-12-certification-gate";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { Phase12CertificationInput, Phase12CertificationResult } from "@/types/phase-12-certification-gate";

export async function requirePhase12CertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): Phase12CertificationInput { return body as Phase12CertificationInput; }
function resultFromBody(body: Record<string, unknown>): Phase12CertificationResult { return (body.result as Phase12CertificationResult | undefined) ?? runPhase12CertificationGate(inputFromBody(body)); }

export function contractResponse() { return getPhase12CertificationGateContract(); }
export async function runRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runPhase12CertificationGate(); }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPhase12CertificationGate(); return { test_registry: result.test_registry, test_results: result.test_results }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPhase12CertificationGate(); return { evidence_registry: result.evidence_registry }; }
export async function reportsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPhase12CertificationGate(); return { determinism: result.determinism, constitutional_governance: result.constitutional_governance, artifacts: result.artifacts, recommendation_intelligence: result.recommendation_intelligence, replay_lineage_integrity: result.replay_lineage_integrity, security_tenant: result.security_tenant, operations: result.operations }; }
export async function decisionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPhase12CertificationGate(); return { decision: result.decision, production_readiness: result.production_readiness }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPhase12CertificationGate(); return { ledger: result.ledger }; }
export async function continuousRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPhase12CertificationGate(); return { continuous_certification: result.continuous_certification }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPhase12CertificationGate(); return { production_readiness: result.production_readiness }; }
export async function validateRequest(request: Request) { return validatePhase12CertificationGate(resultFromBody(await readBody(request))); }
