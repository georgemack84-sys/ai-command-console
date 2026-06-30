import { apiError, apiSuccess } from "@/src/server/api/response";
import { certifyBoundaryRequest, requireBoundaryCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireBoundaryCertificationUser();
    return apiSuccess(await certifyBoundaryRequest(request));
  } catch (error) {
    return apiError(error, "Unable to certify Boundary Enforcement.");
  }
}
