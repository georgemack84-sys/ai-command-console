import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildDefaultPolicyCorrelationHistoricalRecords,
  buildPolicyCorrelationDoctrine,
  buildPolicyCorrelationObservabilitySurface,
  buildPolicyCorrelationSourceRegistry,
  buildPolicyCorrelationRecord,
  computePolicyCorrelationHash,
  generatePolicyCorrelations,
  replayPolicyCorrelation,
  runPolicyCorrelationEngine,
  transitionPolicyCorrelationState,
  validatePolicyCorrelationRecord,
} from "@/services/policy-correlation";
import { buildPolicyAnalysisRecord } from "@/services/policy-analysis";
import type { PolicyAnalysisRecord } from "@/types/policy-analysis";
import type { PolicyCorrelationHistoricalRecord, PolicyCorrelationRecord, PolicyCorrelationState } from "@/types/policy-correlation";

export async function requirePolicyCorrelationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function policyFromBody(body: Record<string, unknown>): PolicyAnalysisRecord {
  return buildPolicyAnalysisRecord({ analysis_state: "VALIDATED", ...((body.policy_analysis as Partial<PolicyAnalysisRecord> | undefined) ?? {}) });
}

function recordsFromBody(body: Record<string, unknown>, policy: PolicyAnalysisRecord): readonly PolicyCorrelationHistoricalRecord[] {
  return (body.records as readonly PolicyCorrelationHistoricalRecord[] | undefined) ?? buildDefaultPolicyCorrelationHistoricalRecords(policy);
}

export function getPolicyCorrelationContract() {
  const policy = buildPolicyAnalysisRecord({ analysis_state: "VALIDATED" });
  return {
    doctrine: buildPolicyCorrelationDoctrine(),
    source_registry: buildPolicyCorrelationSourceRegistry(),
    example_correlations: generatePolicyCorrelations(policy),
  };
}

export function getPolicyCorrelationSources() {
  return buildPolicyCorrelationSourceRegistry();
}

export async function correlatePolicyRequest(request: Request) {
  const body = await readBody(request);
  const policy = policyFromBody(body);
  return runPolicyCorrelationEngine(policy, recordsFromBody(body, policy));
}

export async function inspectPolicyCorrelationRequest(request?: Request) {
  if (!request) return buildPolicyCorrelationObservabilitySurface();
  const body = await readBody(request);
  const policy = policyFromBody(body);
  return buildPolicyCorrelationObservabilitySurface(policy, recordsFromBody(body, policy));
}

export async function validatePolicyCorrelationRequest(request: Request) {
  const body = await readBody(request);
  const policy = policyFromBody(body);
  const record = (body.correlation as Partial<PolicyCorrelationRecord> | undefined) ?? generatePolicyCorrelations(policy)[0];
  return validatePolicyCorrelationRecord(record, { policy_analysis: policy });
}

export async function hashPolicyCorrelationRequest(request: Request) {
  const body = await readBody(request);
  const policy = policyFromBody(body);
  const record = (body.correlation as PolicyCorrelationRecord | undefined) ?? generatePolicyCorrelations(policy)[0];
  return { policy_correlation_hash: record ? computePolicyCorrelationHash(record) : null };
}

export async function transitionPolicyCorrelationRequest(request: Request) {
  const body = await readBody(request) as {
    policy_analysis?: Partial<PolicyAnalysisRecord>;
    correlation?: PolicyCorrelationRecord;
    to_state?: PolicyCorrelationState;
  };
  const policy = buildPolicyAnalysisRecord({ analysis_state: "VALIDATED", ...(body.policy_analysis ?? {}) });
  const record = body.correlation ?? generatePolicyCorrelations(policy)[0];
  if (!record) throw new AppError(400, "policy_correlation_missing", "No PolicyCorrelation record available.");
  return transitionPolicyCorrelationState(record, body.to_state ?? "ARCHIVED", policy);
}

export async function replayPolicyCorrelationRequest(request: Request) {
  const body = await readBody(request);
  const policy = policyFromBody(body);
  const record = (body.correlation as PolicyCorrelationRecord | undefined) ?? generatePolicyCorrelations(policy)[0];
  if (!record) throw new AppError(400, "policy_correlation_missing", "No PolicyCorrelation record available.");
  return replayPolicyCorrelation(record, policy);
}
