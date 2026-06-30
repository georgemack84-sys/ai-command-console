import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectGovernanceLineageRequest, requireGovernanceLineageUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceLineageUser();
    return apiSuccess(await inspectGovernanceLineageRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect governance lineage.");
  }
}

export async function POST(request: Request) {
  try {
    await requireGovernanceLineageUser();
    return apiSuccess(await inspectGovernanceLineageRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect governance lineage.");
  }
}
