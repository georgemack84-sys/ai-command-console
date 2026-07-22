import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireMultiDomainImpactUser, simulateRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireMultiDomainImpactUser();
    return apiSuccess(await simulateRequest(request));
  } catch (error) {
    return apiError(error, "Unable to simulate multi-domain impact.");
  }
}
