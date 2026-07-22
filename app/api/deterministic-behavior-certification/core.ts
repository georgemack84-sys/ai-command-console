import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildDeterministicBehaviorObservability,
  certifyDeterministicBehavior,
  getDeterministicBehaviorContract,
  validateDeterministicBehaviorCertification,
} from "@/services/deterministic-behavior-certification";
import type { DeterministicBehaviorInput, DeterministicBehaviorResult } from "@/types/deterministic-behavior-certification";

export async function requireDeterministicBehaviorUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): DeterministicBehaviorInput { return body as DeterministicBehaviorInput; }
function resultFromBody(body: Record<string, unknown>): DeterministicBehaviorResult { return (body.result as DeterministicBehaviorResult | undefined) ?? certifyDeterministicBehavior(inputFromBody(body)); }
export function contractResponse() { return getDeterministicBehaviorContract(); }
export async function dashboardRequest(request: Request) { return certifyDeterministicBehavior(inputFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateDeterministicBehaviorCertification(resultFromBody(await readBody(request))); }
export async function sectionRequest(request: Request, key: "record" | "proposal_validation" | "scoring_validation" | "suppression_validation" | "prioritization_validation" | "simulation_validation" | "replay_validation" | "dashboard_validation" | "hidden_randomness_validation" | "certification_report" | "consistency_report") { return resultFromBody(await readBody(request))[key]; }
export async function inspectRequest(request?: Request) { if (!request) return buildDeterministicBehaviorObservability(); return buildDeterministicBehaviorObservability(resultFromBody(await readBody(request))); }
