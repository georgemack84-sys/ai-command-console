import { apiError, apiSuccess } from "@/src/server/api/response";
import { evidenceRequest, requireMissionTrendUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireMissionTrendUser();
    return apiSuccess(await evidenceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load mission trend evidence.");
  }
}
