import {
  buildDeterministicMaturityScoringObservabilitySurface,
  getDeterministicMaturityScoringEngineBundle,
  getMaturityWeightingProfile,
  listMaturityScoringLedger,
  listNormalizedMaturityScores,
  scoreMaturityDeterministically,
  validateDeterministicMaturityScoring,
} from "@/services/deterministic-maturity-scoring-engine";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { DeterministicMaturityScoringInput, DeterministicMaturityScoringRepository } from "@/types/deterministic-maturity-scoring-engine";

export async function requireDeterministicMaturityScoringUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function repositoryFromBody(body: Record<string, unknown>): DeterministicMaturityScoringRepository {
  return (body.repository as DeterministicMaturityScoringRepository | undefined) ?? scoreMaturityDeterministically(body as DeterministicMaturityScoringInput);
}

export function scoringBundleResponse() { return getDeterministicMaturityScoringEngineBundle(); }
export async function scoreRequest(request: Request) { return scoreMaturityDeterministically((await readBody(request)) as DeterministicMaturityScoringInput); }
export async function weightsRequest(request: Request) { return getMaturityWeightingProfile((await readBody(request)) as DeterministicMaturityScoringInput); }
export async function normalizedRequest(request: Request) { return listNormalizedMaturityScores((await readBody(request)) as DeterministicMaturityScoringInput); }
export async function ledgerRequest(request: Request) { return listMaturityScoringLedger((await readBody(request)) as DeterministicMaturityScoringInput); }
export async function validateRequest(request: Request) { return validateDeterministicMaturityScoring(repositoryFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildDeterministicMaturityScoringObservabilitySurface();
  return buildDeterministicMaturityScoringObservabilitySurface(repositoryFromBody(await readBody(request)));
}
