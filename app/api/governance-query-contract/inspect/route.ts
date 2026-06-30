import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectGovernanceQueryContractRequest, requireGovernanceQueryContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceQueryContractUser();
    return apiSuccess(await inspectGovernanceQueryContractRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect governance query contract.");
  }
}

export async function POST(request: Request) {
  try {
    await requireGovernanceQueryContractUser();
    return apiSuccess(await inspectGovernanceQueryContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect governance query contract.");
  }
}
