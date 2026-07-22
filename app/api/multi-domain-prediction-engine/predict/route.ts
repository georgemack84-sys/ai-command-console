import { apiError, apiSuccess } from "@/src/server/api/response";
import { predictRequest, requireMultiDomainUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireMultiDomainUser();
    return apiSuccess(await predictRequest(request));
  } catch (error) {
    return apiError(error, "Unable to generate multi-domain prediction.");
  }
}
