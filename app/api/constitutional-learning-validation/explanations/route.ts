import { apiError, apiSuccess } from "@/src/server/api/response";
import { explanationsRequest, requireConstitutionalLearningValidationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireConstitutionalLearningValidationUser(); return apiSuccess(await explanationsRequest(request)); }
  catch (error) { return apiError(error, "Unable to explain constitutional learning validation."); }
}
