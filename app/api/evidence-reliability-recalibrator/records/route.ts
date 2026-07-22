import { apiError, apiSuccess } from "@/src/server/api/response";
import { recordsRequest, requireEvidenceReliabilityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireEvidenceReliabilityUser();
    return apiSuccess(await recordsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve evidence reliability records.");
  }
}
