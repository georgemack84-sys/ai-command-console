import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireExplainabilityContractUser, searchRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireExplainabilityContractUser();
    return apiSuccess(await searchRequest(request));
  } catch (error) {
    return apiError(error, "Unable to search explanations.");
  }
}
