import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireConstitutionalLearningValidationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireConstitutionalLearningValidationUser(); return apiSuccess(await inspectRequest()); }
  catch (error) { return apiError(error, "Unable to inspect constitutional learning validation."); }
}
export async function POST(request: Request) {
  try { await requireConstitutionalLearningValidationUser(); return apiSuccess(await inspectRequest(request)); }
  catch (error) { return apiError(error, "Unable to inspect constitutional learning validation."); }
}
