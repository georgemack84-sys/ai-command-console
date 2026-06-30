import { apiError, apiSuccess } from "@/src/server/api/response";
import { getConstitutionalConstraintsResponse, requireConstitutionalConstraintsUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireConstitutionalConstraintsUser();
    return apiSuccess(getConstitutionalConstraintsResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve constitutional constraints framework.");
  }
}
