import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireMissionHealthCertificationUser, securityValidationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireMissionHealthCertificationUser();
    return apiSuccess(await securityValidationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load mission health security validation.");
  }
}
