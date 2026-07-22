import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildCognitiveExplainabilityObservabilitySurface,
  getCognitiveExplainabilityEngineContract,
  replayCognitiveExplainability,
  runCognitiveExplainability,
  validateCognitiveExplainability,
} from "@/services/cognitive-explainability-engine";
import type { CognitiveExplainabilityInput, CognitiveExplainabilityRepository } from "@/types/cognitive-explainability-engine";

export async function requireCognitiveExplainabilityUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): CognitiveExplainabilityInput {
  return body as CognitiveExplainabilityInput;
}

function repositoryFromBody(body: Record<string, unknown>): CognitiveExplainabilityRepository {
  return (body.repository as CognitiveExplainabilityRepository | undefined) ?? runCognitiveExplainability(inputFromBody(body));
}

export function contractResponse() { return getCognitiveExplainabilityEngineContract(); }
export async function explainRequest(request: Request) { return runCognitiveExplainability(inputFromBody(await readBody(request))); }
export async function reasoningGraphRequest(request: Request) { return repositoryFromBody(await readBody(request)).explanations.map((item) => item.reasoning_graph); }
export async function evidenceRequest(request: Request) { return repositoryFromBody(await readBody(request)).explanations.flatMap((item) => item.evidence_hierarchy); }
export async function counterfactualsRequest(request: Request) { return repositoryFromBody(await readBody(request)).explanations.flatMap((item) => item.counterfactual_analysis); }
export async function narrativeRequest(request: Request) {
  const repository = repositoryFromBody(await readBody(request));
  return {
    repository_id: repository.repository_id,
    narratives: repository.explanations.map((item) => ({
      explanation_id: item.explanation_id,
      level: item.level,
      confidence_narrative: item.confidence_narrative,
      governance_reasoning: item.governance_reasoning,
      constitutional_reasoning: item.constitutional_reasoning,
      replay_narrative: item.replay_narrative,
      operator_briefing: item.operator_briefing,
    })),
  };
}
export async function validateRequest(request: Request) { return validateCognitiveExplainability(repositoryFromBody(await readBody(request))); }
export async function replayRequest(request: Request) { return replayCognitiveExplainability(repositoryFromBody(await readBody(request))); }
export async function certificationRequest(request: Request) {
  const repository = repositoryFromBody(await readBody(request));
  return {
    repository_id: repository.repository_id,
    certification_evidence: repository.certification_evidence,
    lineage_references: repository.lineage_references,
    integrity_hashes: repository.integrity_hashes,
    validation: validateCognitiveExplainability(repository),
  };
}
export async function inspectRequest(request?: Request) {
  if (!request) return buildCognitiveExplainabilityObservabilitySurface();
  return buildCognitiveExplainabilityObservabilitySurface(repositoryFromBody(await readBody(request)));
}
