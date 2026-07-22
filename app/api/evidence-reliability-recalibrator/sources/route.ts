import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireEvidenceReliabilityUser, sourcesRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireEvidenceReliabilityUser();
    return apiSuccess(await sourcesRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve source reliability profiles.");
  }
}
