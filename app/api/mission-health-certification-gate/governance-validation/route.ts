import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceValidationRequest, requireMissionHealthCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireMissionHealthCertificationUser();
    return apiSuccess(await governanceValidationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load mission health governance validation.");
  }
}
