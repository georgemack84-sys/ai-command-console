import { apiError, apiSuccess } from "@/src/server/api/response";
import { recordsRequest, requireConstitutionalLearningValidationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireConstitutionalLearningValidationUser(); return apiSuccess(await recordsRequest(request)); }
  catch (error) { return apiError(error, "Unable to list constitutional learning validation records."); }
}
