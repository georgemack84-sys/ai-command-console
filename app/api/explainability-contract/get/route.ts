import { apiError, apiSuccess } from "@/src/server/api/response";
import { getRequest, requireExplainabilityContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireExplainabilityContractUser();
    return apiSuccess(await getRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve explanation.");
  }
}
