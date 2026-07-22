import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireMissionHealthUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireMissionHealthUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to load mission health contract.");
  }
}
