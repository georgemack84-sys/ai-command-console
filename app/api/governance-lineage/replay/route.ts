import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayGovernanceLineageRequest, requireGovernanceLineageUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceLineageUser();
    return apiSuccess(await replayGovernanceLineageRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay governance lineage.");
  }
}
