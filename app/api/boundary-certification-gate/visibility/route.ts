import { apiError, apiSuccess } from "@/src/server/api/response";
import { boundaryCertificationVisibilityRequest, requireBoundaryCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireBoundaryCertificationUser();
    return apiSuccess(await boundaryCertificationVisibilityRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect Boundary Certification visibility.");
  }
}

export async function POST(request: Request) {
  try {
    await requireBoundaryCertificationUser();
    return apiSuccess(await boundaryCertificationVisibilityRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect Boundary Certification visibility.");
  }
}
