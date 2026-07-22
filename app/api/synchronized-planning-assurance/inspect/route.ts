import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireSynchronizedPlanningUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSynchronizedPlanningUser();
    return apiSuccess(await inspectRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect synchronized planning assurance.");
  }
}

export async function POST(request: Request) {
  try {
    await requireSynchronizedPlanningUser();
    return apiSuccess(await inspectRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect synchronized planning assurance.");
  }
}
