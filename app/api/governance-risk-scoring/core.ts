import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildGovernanceRiskScoringDoctrine,
  buildGovernanceRiskScoreObservabilitySurface,
  buildGovernanceRiskScoreRecord,
  calculateBaseScore,
  computeGovernanceRiskScoreHash,
  replayGovernanceRiskScore,
  scoreGovernanceRisk,
  transitionGovernanceRiskScoreState,
  validateGovernanceRiskScoreRecord,
} from "@/services/governance-risk-scoring";
import type { GovernanceRiskScoreRecord, GovernanceRiskScoreState } from "@/types/governance-risk-scoring";

export async function requireGovernanceRiskScoringUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getGovernanceRiskScoringContract() {
  return {
    doctrine: buildGovernanceRiskScoringDoctrine(),
    model_versions: {
      scoring_model_version: "GOV-RISK-SCORE-V1",
      confidence_model_version: "GOV-RISK-CONFIDENCE-V1",
      severity_threshold_version: "GOV-RISK-THRESHOLD-V1",
      driver_extraction_model_version: "GOV-RISK-DRIVER-V1",
      explanation_model_version: "GOV-RISK-EXPLANATION-V1",
    },
    base_scores: {
      POLICY_RISK: calculateBaseScore("POLICY_RISK"),
      AUTHORITY_RISK: calculateBaseScore("AUTHORITY_RISK"),
      TENANT_ISOLATION_RISK: calculateBaseScore("TENANT_ISOLATION_RISK"),
    },
    record: buildGovernanceRiskScoreRecord(),
  };
}

export async function scoreGovernanceRiskRequest(request: Request) {
  const body = await readBody(request);
  return scoreGovernanceRisk(body);
}

export async function validateGovernanceRiskScoreRequest(request: Request) {
  const body = await readBody(request);
  return validateGovernanceRiskScoreRecord(Object.keys(body).length ? body as Partial<GovernanceRiskScoreRecord> : buildGovernanceRiskScoreRecord());
}

export async function hashGovernanceRiskScoreRequest(request: Request) {
  const body = await readBody(request);
  const record = Object.keys(body).length ? buildGovernanceRiskScoreRecord(body as Partial<GovernanceRiskScoreRecord>) : buildGovernanceRiskScoreRecord();
  return { governance_risk_score_hash: computeGovernanceRiskScoreHash(record) };
}

export async function replayGovernanceRiskScoreRequest(request: Request) {
  const body = await readBody(request);
  return replayGovernanceRiskScore(Object.keys(body).length ? buildGovernanceRiskScoreRecord(body as Partial<GovernanceRiskScoreRecord>) : buildGovernanceRiskScoreRecord());
}

export async function transitionGovernanceRiskScoreRequest(request: Request) {
  const body = await readBody(request) as { record?: Partial<GovernanceRiskScoreRecord>; to_state?: GovernanceRiskScoreState };
  return transitionGovernanceRiskScoreState(buildGovernanceRiskScoreRecord(body.record ?? {}), body.to_state ?? "UNDER_REVIEW");
}

export async function inspectGovernanceRiskScoreRequest(request?: Request) {
  if (!request) return buildGovernanceRiskScoreObservabilitySurface();
  const body = await readBody(request);
  return buildGovernanceRiskScoreObservabilitySurface(Object.keys(body).length ? buildGovernanceRiskScoreRecord(body as Partial<GovernanceRiskScoreRecord>) : buildGovernanceRiskScoreRecord());
}
