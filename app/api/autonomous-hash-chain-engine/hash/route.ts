import { apiError, apiSuccess } from "@/src/server/api/response";
import { hashAutonomousArtifactRequest, requireAutonomousHashChainUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireAutonomousHashChainUser(); return apiSuccess(await hashAutonomousArtifactRequest(request)); }
  catch (error) { return apiError(error, "Unable to hash autonomous artifact."); }
}
