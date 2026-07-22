import { getProvingBenchmarkingComparativeAnalysisBundle, runProvingBenchmarkingComparativeAnalysis, validateProvingBenchmarkingComparativeAnalysis } from "@/services/proving-benchmarking-comparative-analysis";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { BenchmarkInput, BenchmarkResult } from "@/types/proving-benchmarking-comparative-analysis";

export async function requireBenchmarkingUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): BenchmarkInput { return body as BenchmarkInput; }
function resultFromBody(body: Record<string, unknown>): BenchmarkResult { return (body.result as BenchmarkResult | undefined) ?? runProvingBenchmarkingComparativeAnalysis(inputFromBody(body)); }
export function contractResponse() { return getProvingBenchmarkingComparativeAnalysisBundle(); }
export async function validateRequest(request: Request) { return validateProvingBenchmarkingComparativeAnalysis(resultFromBody(await readBody(request))); }
export async function frameworkRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingBenchmarkingComparativeAnalysis(); return { framework: result.framework }; }
export async function executionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingBenchmarkingComparativeAnalysis(); return { execution: result.execution }; }
export async function capabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingBenchmarkingComparativeAnalysis(); return { capability_assessment: result.capability_assessment }; }
export async function comparativeRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingBenchmarkingComparativeAnalysis(); return { comparative_study: result.comparative_study }; }
export async function scorecardRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingBenchmarkingComparativeAnalysis(); return { scorecard: result.scorecard }; }
export async function maturityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingBenchmarkingComparativeAnalysis(); return { maturity_assessment: result.maturity_assessment }; }
export async function trendsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingBenchmarkingComparativeAnalysis(); return { trend_report: result.trend_report }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingBenchmarkingComparativeAnalysis(); return { evidence_package: result.evidence_package }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingBenchmarkingComparativeAnalysis(); return { governance_report: result.governance_report }; }
export async function dashboardRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingBenchmarkingComparativeAnalysis(); return { dashboard: result.dashboard }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingBenchmarkingComparativeAnalysis(); return { gates: result.gates, boundaries: result.boundaries, readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
