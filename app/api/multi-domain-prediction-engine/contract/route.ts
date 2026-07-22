import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireMultiDomainUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireMultiDomainUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to load multi-domain prediction engine contract.");
  }
}
