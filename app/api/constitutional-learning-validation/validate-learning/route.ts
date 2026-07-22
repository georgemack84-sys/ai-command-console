import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireConstitutionalLearningValidationUser, validateLearningRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireConstitutionalLearningValidationUser(); return apiSuccess(contractResponse()); }
  catch (error) { return apiError(error, "Unable to load constitutional learning validation engine."); }
}
export async function POST(request: Request) {
  try { await requireConstitutionalLearningValidationUser(); return apiSuccess(await validateLearningRequest(request)); }
  catch (error) { return apiError(error, "Unable to validate constitutional learning proposal."); }
}
