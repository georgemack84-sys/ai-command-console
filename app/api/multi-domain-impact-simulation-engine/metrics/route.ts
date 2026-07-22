import { apiError, apiSuccess } from "@/src/server/api/response";
import { metricsRequest, requireMultiDomainImpactUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireMultiDomainImpactUser();
    return apiSuccess(await metricsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve multi-domain impact metrics.");
  }
}
