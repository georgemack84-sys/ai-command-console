import { apiError, apiSuccess } from "@/src/server/api/response";
import { classificationsRequest, requireConstitutionalViolationDetectionUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireConstitutionalViolationDetectionUser(); return apiSuccess(await classificationsRequest(request)); }
  catch (error) { return apiError(error, "Unable to classify constitutional violations."); }
}
