import { getProvingPerformanceScalabilityQualificationBundle, runProvingPerformanceScalabilityQualification, validateProvingPerformanceScalabilityQualification } from "@/services/proving-performance-scalability-qualification";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { PerformanceInput, PerformanceResult } from "@/types/proving-performance-scalability-qualification";

export async function requirePerformanceQualificationUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): PerformanceInput { return body as PerformanceInput; }
function resultFromBody(body: Record<string, unknown>): PerformanceResult { return (body.result as PerformanceResult | undefined) ?? runProvingPerformanceScalabilityQualification(inputFromBody(body)); }
export function contractResponse() { return getProvingPerformanceScalabilityQualificationBundle(); }
export async function validateRequest(request: Request) { return validateProvingPerformanceScalabilityQualification(resultFromBody(await readBody(request))); }
export async function frameworkRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingPerformanceScalabilityQualification(); return { framework: result.framework }; }
export async function benchmarksRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingPerformanceScalabilityQualification(); return { benchmark_catalog: result.benchmark_catalog }; }
export async function executionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingPerformanceScalabilityQualification(); return { benchmark_execution: result.benchmark_execution }; }
export async function metricsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingPerformanceScalabilityQualification(); return { metrics: result.metrics }; }
export async function resourcesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingPerformanceScalabilityQualification(); return { resource_report: result.resource_report }; }
export async function scalabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingPerformanceScalabilityQualification(); return { scalability_report: result.scalability_report }; }
export async function capacityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingPerformanceScalabilityQualification(); return { capacity_report: result.capacity_report }; }
export async function bottlenecksRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingPerformanceScalabilityQualification(); return { bottleneck_report: result.bottleneck_report }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingPerformanceScalabilityQualification(); return { evidence: result.evidence }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingPerformanceScalabilityQualification(); return { gates: result.gates, invariants: result.invariants, boundaries: result.boundaries, readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
