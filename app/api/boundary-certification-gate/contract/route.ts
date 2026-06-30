import { apiError, apiSuccess } from "@/src/server/api/response";
import { getBoundaryCertificationContractResponse, requireBoundaryCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireBoundaryCertificationUser();
    return apiSuccess(getBoundaryCertificationContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load Boundary Certification Gate contract.");
  }
}
