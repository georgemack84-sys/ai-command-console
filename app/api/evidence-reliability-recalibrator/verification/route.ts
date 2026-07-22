import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireEvidenceReliabilityUser, verificationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireEvidenceReliabilityUser();
    return apiSuccess(await verificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve evidence verification analysis.");
  }
}
