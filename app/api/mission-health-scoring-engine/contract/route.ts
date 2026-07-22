import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireMissionHealthScoringUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireMissionHealthScoringUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to load mission health scoring contract.");
  }
}
