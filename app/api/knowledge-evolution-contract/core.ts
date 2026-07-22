import {
  buildKnowledgeEvolutionObservabilitySurface,
  getKnowledgeActivationContract,
  getKnowledgeArtifactSchema,
  getKnowledgeEvolutionContract,
  getKnowledgeEvolutionContractBundle,
  getKnowledgeGovernanceRules,
  getKnowledgeLifecycleModel,
  validateKnowledgeEvolutionContract,
} from "@/services/knowledge-evolution-contract";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { KnowledgeEvolutionContract, KnowledgeEvolutionInput } from "@/types/knowledge-evolution-contract";

export async function requireKnowledgeEvolutionUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function contractFromBody(body: Record<string, unknown>): KnowledgeEvolutionContract {
  return (body.contract as KnowledgeEvolutionContract | undefined) ?? getKnowledgeEvolutionContract(body as KnowledgeEvolutionInput);
}

export function contractResponse() { return getKnowledgeEvolutionContractBundle(); }
export async function contractRequest(request: Request) { return getKnowledgeEvolutionContract((await readBody(request)) as KnowledgeEvolutionInput); }
export async function schemaRequest(request: Request) { return getKnowledgeArtifactSchema((await readBody(request)) as KnowledgeEvolutionInput); }
export async function lifecycleRequest(request: Request) { return getKnowledgeLifecycleModel((await readBody(request)) as KnowledgeEvolutionInput); }
export async function governanceRequest(request: Request) { return getKnowledgeGovernanceRules((await readBody(request)) as KnowledgeEvolutionInput); }
export async function activationRequest(request: Request) { return getKnowledgeActivationContract((await readBody(request)) as KnowledgeEvolutionInput); }
export async function validateRequest(request: Request) { return validateKnowledgeEvolutionContract(contractFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildKnowledgeEvolutionObservabilitySurface();
  return buildKnowledgeEvolutionObservabilitySurface(contractFromBody(await readBody(request)));
}
