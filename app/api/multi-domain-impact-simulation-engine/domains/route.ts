import { apiError, apiSuccess } from "@/src/server/api/response";
import { domainsRequest, requireMultiDomainImpactUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireMultiDomainImpactUser();
    return apiSuccess(await domainsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve domain impact assessments.");
  }
}
