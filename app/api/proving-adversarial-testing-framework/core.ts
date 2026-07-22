import { getProvingAdversarialTestingFrameworkBundle, runProvingAdversarialTestingFramework, validateProvingAdversarialTestingFramework } from "@/services/proving-adversarial-testing-framework";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { AdversarialInput, AdversarialResult } from "@/types/proving-adversarial-testing-framework";

export async function requireAdversarialTestingUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): AdversarialInput { return body as AdversarialInput; }
function resultFromBody(body: Record<string, unknown>): AdversarialResult { return (body.result as AdversarialResult | undefined) ?? runProvingAdversarialTestingFramework(inputFromBody(body)); }
export function contractResponse() { return getProvingAdversarialTestingFrameworkBundle(); }
export async function validateRequest(request: Request) { return validateProvingAdversarialTestingFramework(resultFromBody(await readBody(request))); }
export async function architectureRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingAdversarialTestingFramework(); return { architecture: result.architecture }; }
export async function attackCatalogRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingAdversarialTestingFramework(); return { attack_catalog: result.attack_catalog }; }
export async function attackScenariosRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingAdversarialTestingFramework(); return { attack_scenarios: result.attack_scenarios }; }
export async function faultInjectionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingAdversarialTestingFramework(); return { fault_injection: result.fault_injection }; }
export async function misuseRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingAdversarialTestingFramework(); return { misuse_report: result.misuse_report }; }
export async function abuseRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingAdversarialTestingFramework(); return { abuse_report: result.abuse_report }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingAdversarialTestingFramework(); return { governance_report: result.governance_report }; }
export async function isolationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingAdversarialTestingFramework(); return { isolation_report: result.isolation_report }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingAdversarialTestingFramework(); return { replay_attack_report: result.replay_attack_report }; }
export async function recoveryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingAdversarialTestingFramework(); return { recovery_report: result.recovery_report }; }
export async function analyticsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingAdversarialTestingFramework(); return { analytics: result.analytics }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingAdversarialTestingFramework(); return { evidence_package: result.evidence_package }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingAdversarialTestingFramework(); return { gates: result.gates, invariants: result.invariants, boundaries: result.boundaries, readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
