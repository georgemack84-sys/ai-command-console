import { apiError, apiSuccess } from "@/src/server/api/response";
import { domainsRequest, requireMultiDomainUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireMultiDomainUser();
    return apiSuccess(await domainsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load multi-domain profiles.");
  }
}
