import { apiError, apiSuccess } from "@/src/server/api/response";
import { dashboardRequest, requireInstitutionalMemoryUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireInstitutionalMemoryUser();
    return apiSuccess(await dashboardRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect institutional memory engine.");
  }
}

export async function POST(request: Request) {
  try {
    await requireInstitutionalMemoryUser();
    return apiSuccess(await dashboardRequest(request));
  } catch (error) {
    return apiError(error, "Unable to build institutional memory engine.");
  }
}
