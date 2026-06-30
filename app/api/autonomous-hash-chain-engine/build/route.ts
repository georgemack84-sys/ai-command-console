import { apiError, apiSuccess } from "@/src/server/api/response";
import { buildAutonomousHashChainRequest, requireAutonomousHashChainUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireAutonomousHashChainUser(); return apiSuccess(await buildAutonomousHashChainRequest(request)); }
  catch (error) { return apiError(error, "Unable to build Autonomous Hash Chain."); }
}
