import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireOutcomeDashboardUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireOutcomeDashboardUser();
    return apiSuccess(await inspectRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect outcome intelligence dashboard.");
  }
}

export async function POST(request: Request) {
  try {
    await requireOutcomeDashboardUser();
    return apiSuccess(await inspectRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect outcome intelligence dashboard.");
  }
}
