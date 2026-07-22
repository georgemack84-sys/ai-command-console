import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireCoordinationCertificationUser, validateGovernanceRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireCoordinationCertificationUser(); return apiSuccess(await validateGovernanceRequest(request)); }
  catch (error) { return apiError(error, "Unable to validate coordination assurance certification governance."); }
}
