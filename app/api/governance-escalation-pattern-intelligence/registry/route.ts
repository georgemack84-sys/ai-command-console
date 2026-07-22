import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceRegistryRequest, requireGovernanceEscalationPatternUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceEscalationPatternUser();
    return apiSuccess(await governanceRegistryRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve governance pattern registry.");
  }
}
