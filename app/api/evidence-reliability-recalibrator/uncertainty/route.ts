import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireEvidenceReliabilityUser, uncertaintyRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireEvidenceReliabilityUser();
    return apiSuccess(await uncertaintyRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve evidence uncertainty analysis.");
  }
}
