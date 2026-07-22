import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireDriftDefenseCertificationUser, traceabilityRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDriftDefenseCertificationUser();
    return apiSuccess(await traceabilityRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve certification traceability.");
  }
}
