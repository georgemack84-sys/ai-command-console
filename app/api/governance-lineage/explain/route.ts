import { apiError, apiSuccess } from "@/src/server/api/response";
import { explainGovernanceLineageRequest, requireGovernanceLineageUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceLineageUser();
    return apiSuccess(await explainGovernanceLineageRequest(request));
  } catch (error) {
    return apiError(error, "Unable to explain governance lineage.");
  }
}
