import { apiError, apiSuccess } from "@/src/server/api/response";
import { explainRequest, requireMultiDomainUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireMultiDomainUser();
    return apiSuccess(await explainRequest(request));
  } catch (error) {
    return apiError(error, "Unable to explain multi-domain prediction.");
  }
}
