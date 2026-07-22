import { getSkillRegistryBundle, runSkillRegistry, validateSkillRegistry } from "@/services/skill-registry";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { SkillRegistryInput, SkillRegistryResult } from "@/types/skill-registry";

export async function requireSkillRegistryUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): SkillRegistryInput { return body as SkillRegistryInput; }
function resultFromBody(body: Record<string, unknown>): SkillRegistryResult { return (body.result as SkillRegistryResult | undefined) ?? runSkillRegistry(inputFromBody(body)); }
export function contractResponse() { return getSkillRegistryBundle(); }
export async function validateRequest(request: Request) { return validateSkillRegistry(resultFromBody(await readBody(request))); }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSkillRegistry(); return { registry: result.registry }; }
export async function packagesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSkillRegistry(); return { packages: result.packages }; }
export async function versionsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSkillRegistry(); return { versions: result.versions }; }
export async function dependenciesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSkillRegistry(); return { dependencies: result.dependencies }; }
export async function compatibilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSkillRegistry(); return { compatibility: result.compatibility }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSkillRegistry(); return { certification: result.certification }; }
export async function discoveryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSkillRegistry(); return { discovery: result.discovery }; }
export async function testHarnessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSkillRegistry(); return { test_harness: result.test_harness }; }
export async function governanceApisRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSkillRegistry(); return { governance_apis: result.governance_apis }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSkillRegistry(); return { evidence: result.evidence }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSkillRegistry(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
