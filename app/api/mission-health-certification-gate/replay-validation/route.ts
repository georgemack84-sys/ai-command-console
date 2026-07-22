import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayValidationRequest, requireMissionHealthCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireMissionHealthCertificationUser();
    return apiSuccess(await replayValidationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load mission health replay validation.");
  }
}
