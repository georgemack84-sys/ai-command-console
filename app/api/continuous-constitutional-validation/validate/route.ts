import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireContinuousConstitutionalUser, validateRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await requireContinuousConstitutionalUser(); return apiSuccess(contractResponse()); }
  catch (error) { return apiError(error, "Unable to load continuous constitutional validation engine."); }
}
export async function POST(request: Request) {
  try { await requireContinuousConstitutionalUser(); return apiSuccess(await validateRequest(request)); }
  catch (error) { return apiError(error, "Unable to validate constitutional compliance."); }
}
