import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireMissionHealthCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireMissionHealthCertificationUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to load mission health certification contract.");
  }
}
