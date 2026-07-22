import { apiError, apiSuccess } from "@/src/server/api/response";
import { lineageRequest, requireInstitutionalMemoryUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireInstitutionalMemoryUser();
    return apiSuccess(await lineageRequest());
  } catch (error) {
    return apiError(error, "Unable to retrieve institutional memory lineage.");
  }
}

export async function POST(request: Request) {
  try {
    await requireInstitutionalMemoryUser();
    return apiSuccess(await lineageRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay institutional memory lineage.");
  }
}
