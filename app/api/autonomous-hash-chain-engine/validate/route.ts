import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAutonomousHashChainUser, validateAutonomousHashChainRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireAutonomousHashChainUser(); return apiSuccess(await validateAutonomousHashChainRequest(request)); }
  catch (error) { return apiError(error, "Unable to validate Autonomous Hash Chain."); }
}
