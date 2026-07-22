import { getWaveFiveWritingPublisherBundle, runWaveFiveWritingPublisher, validateWaveFiveWritingPublisher } from "@/services/wave-five-writing-publisher-os";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { WaveFiveWritingPublisherInput, WaveFiveWritingPublisherResult } from "@/types/wave-five-writing-publisher-os";

export async function requireWaveFiveWritingPublisherUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): WaveFiveWritingPublisherInput { return body as WaveFiveWritingPublisherInput; }
function resultFromBody(body: Record<string, unknown>): WaveFiveWritingPublisherResult { return (body.result as WaveFiveWritingPublisherResult | undefined) ?? runWaveFiveWritingPublisher(inputFromBody(body)); }
export function contractResponse() { return getWaveFiveWritingPublisherBundle(); }
export async function validateRequest(request: Request) { return validateWaveFiveWritingPublisher(resultFromBody(await readBody(request))); }
export async function workspaceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveWritingPublisher(); return { workspace: result.workspace }; }
export async function editorialRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveWritingPublisher(); return { editorial: result.editorial }; }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveWritingPublisher(); return { registry: result.registry }; }
export async function publisherOsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveWritingPublisher(); return { publisher_os: result.publisher_os }; }
export async function distributionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveWritingPublisher(); return { distribution: result.distribution }; }
export async function aiVersionAssetsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveWritingPublisher(); return { ai_version_assets: result.ai_version_assets }; }
export async function evidenceGovernanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveWritingPublisher(); return { evidence_governance: result.evidence_governance }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runWaveFiveWritingPublisher(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
