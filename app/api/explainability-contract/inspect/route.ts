import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireExplainabilityContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireExplainabilityContractUser();
    return apiSuccess(await inspectRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect explainability contract.");
  }
}

export async function POST(request: Request) {
  try {
    await requireExplainabilityContractUser();
    return apiSuccess(await inspectRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect explainability contract.");
  }
}
