import { apiError, apiSuccess } from "@/src/server/api/response";
import { observabilityRequest, requireInstitutionalMemoryUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireInstitutionalMemoryUser();
    return apiSuccess(await observabilityRequest());
  } catch (error) {
    return apiError(error, "Unable to retrieve institutional memory observability.");
  }
}

export async function POST(request: Request) {
  try {
    await requireInstitutionalMemoryUser();
    return apiSuccess(await observabilityRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect institutional memory observability.");
  }
}
