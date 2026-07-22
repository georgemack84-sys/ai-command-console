import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireMissionTrendUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireMissionTrendUser();
    return apiSuccess(await inspectRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect mission trend surface.");
  }
}

export async function POST(request: Request) {
  try {
    await requireMissionTrendUser();
    return apiSuccess(await inspectRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect mission trend surface.");
  }
}
