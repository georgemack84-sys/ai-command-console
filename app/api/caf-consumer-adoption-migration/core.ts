import {
  getConsumerAdoptionMigrationBundle,
  runConsumerAdoptionMigration,
  validateConsumerAdoptionMigration,
} from "@/services/caf-consumer-adoption-migration";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ConsumerAdoptionMigrationInput, ConsumerAdoptionMigrationResult } from "@/types/caf-consumer-adoption-migration";

export async function requireConsumerAdoptionMigrationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ConsumerAdoptionMigrationInput { return body as ConsumerAdoptionMigrationInput; }
function resultFromBody(body: Record<string, unknown>): ConsumerAdoptionMigrationResult { return (body.result as ConsumerAdoptionMigrationResult | undefined) ?? runConsumerAdoptionMigration(inputFromBody(body)); }

export function contractResponse() { return getConsumerAdoptionMigrationBundle(); }
export async function validateRequest(request: Request) { return validateConsumerAdoptionMigration(resultFromBody(await readBody(request))); }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runConsumerAdoptionMigration(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
export async function planRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runConsumerAdoptionMigration(); return { migration_plan: result.migration_plan }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runConsumerAdoptionMigration(); return { readiness_assessment: result.readiness_assessment }; }
export async function compatibilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runConsumerAdoptionMigration(); return { compatibility_result: result.compatibility_result }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runConsumerAdoptionMigration(); return { adoption_decision: result.adoption_decision }; }
export async function rolloutRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runConsumerAdoptionMigration(); return { rollout_status: result.rollout_status }; }
export async function transitionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runConsumerAdoptionMigration(); return { transition_record: result.transition_record }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runConsumerAdoptionMigration(); return { migration_evidence: result.migration_evidence }; }
export async function reportsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runConsumerAdoptionMigration(); return { adoption_report: result.adoption_report }; }
