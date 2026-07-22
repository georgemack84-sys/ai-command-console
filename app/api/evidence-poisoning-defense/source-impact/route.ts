import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireEvidencePoisoningUser, sourceImpactRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireEvidencePoisoningUser();
    return apiSuccess(await sourceImpactRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve source reliability impact.");
  }
}
