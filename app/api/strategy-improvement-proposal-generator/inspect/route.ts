import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireStrategyImprovementProposalUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireStrategyImprovementProposalUser();
    return apiSuccess(await inspectRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect strategy improvement proposal generator.");
  }
}

export async function POST(request: Request) {
  try {
    await requireStrategyImprovementProposalUser();
    return apiSuccess(await inspectRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect strategy improvement proposal generator.");
  }
}
