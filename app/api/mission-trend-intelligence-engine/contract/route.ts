import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireMissionTrendUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireMissionTrendUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to load mission trend intelligence contract.");
  }
}
