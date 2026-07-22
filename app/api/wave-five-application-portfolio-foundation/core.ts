import { getWaveFiveApplicationPortfolioFoundationBundle, runWaveFiveApplicationPortfolioFoundation, validateWaveFiveApplicationPortfolioFoundation } from "@/services/wave-five-application-portfolio-foundation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { WaveFiveApplicationFoundationInput, WaveFiveApplicationFoundationResult } from "@/types/wave-five-application-portfolio-foundation";

export async function requireWaveFiveApplicationPortfolioFoundationUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): WaveFiveApplicationFoundationInput { return body as WaveFiveApplicationFoundationInput; }
function resultFromBody(body: Record<string, unknown>): WaveFiveApplicationFoundationResult { return (body.result as WaveFiveApplicationFoundationResult | undefined) ?? runWaveFiveApplicationPortfolioFoundation(inputFromBody(body)); }
export function contractResponse() { return getWaveFiveApplicationPortfolioFoundationBundle(); }
export async function validateRequest(request: Request) { return validateWaveFiveApplicationPortfolioFoundation(resultFromBody(await readBody(request))); }
export async function constitutionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveApplicationPortfolioFoundation(); return { constitution: result.constitution }; }
export async function portfolioRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveApplicationPortfolioFoundation(); return { portfolio: result.portfolio }; }
export async function ownershipRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveApplicationPortfolioFoundation(); return { ownership: result.ownership }; }
export async function dependenciesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveApplicationPortfolioFoundation(); return { dependencies: result.dependencies }; }
export async function lifecycleRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveApplicationPortfolioFoundation(); return { lifecycle: result.lifecycle }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveApplicationPortfolioFoundation(); return { certification: result.certification }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveApplicationPortfolioFoundation(); return { governance: result.governance }; }
export async function integrationsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveApplicationPortfolioFoundation(); return { integrations: result.integrations }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveApplicationPortfolioFoundation(); return { evidence: result.evidence }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveApplicationPortfolioFoundation(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
