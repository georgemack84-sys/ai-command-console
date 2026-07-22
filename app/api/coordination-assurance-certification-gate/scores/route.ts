import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireCoordinationCertificationUser, scoresRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireCoordinationCertificationUser(); return apiSuccess(await scoresRequest(request)); }
  catch (error) { return apiError(error, "Unable to calculate coordination assurance certification scores."); }
}
