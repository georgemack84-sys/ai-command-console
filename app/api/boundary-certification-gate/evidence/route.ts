import { apiError, apiSuccess } from "@/src/server/api/response";
import { boundaryCertificationEvidenceRequest, requireBoundaryCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireBoundaryCertificationUser();
    return apiSuccess(await boundaryCertificationEvidenceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve Boundary Certification evidence.");
  }
}
