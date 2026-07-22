import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildReplayCertificationObservability,
  certifyReplay,
  getReplayCertificationContract,
  validateReplayCertification,
} from "@/services/replay-certification";
import type { ReplayCertificationInput, ReplayCertificationResult } from "@/types/replay-certification";

export async function requireReplayCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ReplayCertificationInput { return body as ReplayCertificationInput; }
function resultFromBody(body: Record<string, unknown>): ReplayCertificationResult { return (body.result as ReplayCertificationResult | undefined) ?? certifyReplay(inputFromBody(body)); }
export function contractResponse() { return getReplayCertificationContract(); }
export async function dashboardRequest(request: Request) { return certifyReplay(inputFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateReplayCertification(resultFromBody(await readBody(request))); }
export async function sectionRequest(request: Request, key: "record" | "input_reconstruction" | "evidence_reconstruction" | "reasoning_equivalence" | "output_reconstruction" | "governance_replay" | "constitutional_replay" | "simulation_replay" | "ledger_replay" | "replay_integrity" | "certification_report" | "reconstruction_report") { return resultFromBody(await readBody(request))[key]; }
export async function inspectRequest(request?: Request) { if (!request) return buildReplayCertificationObservability(); return buildReplayCertificationObservability(resultFromBody(await readBody(request))); }
