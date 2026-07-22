import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildPredictionKnowledgeObservabilitySurface,
  getPredictionKnowledgeRepositoryContract,
  replayPredictionKnowledgeRepository,
  runPredictionKnowledgeRepository,
  validatePredictionKnowledgeRepository,
} from "@/services/prediction-knowledge-repository";
import type { PredictionKnowledgeInput, PredictionKnowledgeRepository } from "@/types/prediction-knowledge-repository";

export async function requirePredictionKnowledgeUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): PredictionKnowledgeInput {
  return body as PredictionKnowledgeInput;
}

function repositoryFromBody(body: Record<string, unknown>): PredictionKnowledgeRepository {
  return (body.repository as PredictionKnowledgeRepository | undefined) ?? runPredictionKnowledgeRepository(inputFromBody(body));
}

export function contractResponse() { return getPredictionKnowledgeRepositoryContract(); }
export async function registerRequest(request: Request) { return runPredictionKnowledgeRepository(inputFromBody(await readBody(request))); }
export async function repositoryRequest(request: Request) { return repositoryFromBody(await readBody(request)); }
export async function graphRequest(request: Request) { return repositoryFromBody(await readBody(request)).knowledge_graph; }
export async function timelineRequest(request: Request) {
  const repository = repositoryFromBody(await readBody(request));
  return {
    repository_id: repository.repository_id,
    timeline: repository.knowledge_objects.map((object) => ({
      knowledge_id: object.knowledge_id,
      knowledge_type: object.knowledge_type,
      knowledge_state: object.knowledge_state,
      created_at: object.created_at,
      last_certified_at: object.last_certified_at,
      lineage_reference: object.lineage_reference,
      replay_reference: object.replay_reference,
    })),
  };
}
export async function validateRequest(request: Request) { return validatePredictionKnowledgeRepository(repositoryFromBody(await readBody(request))); }
export async function replayRequest(request: Request) { return replayPredictionKnowledgeRepository(repositoryFromBody(await readBody(request))); }
export async function certificationRequest(request: Request) {
  const repository = repositoryFromBody(await readBody(request));
  return {
    repository_id: repository.repository_id,
    certification_evidence: repository.certification_evidence,
    replay_artifacts: repository.replay_artifacts,
    lineage_references: repository.lineage_references,
    integrity_hashes: repository.integrity_hashes,
    validation: validatePredictionKnowledgeRepository(repository),
  };
}
export async function inspectRequest(request?: Request) {
  if (!request) return buildPredictionKnowledgeObservabilitySurface();
  return buildPredictionKnowledgeObservabilitySurface(repositoryFromBody(await readBody(request)));
}
