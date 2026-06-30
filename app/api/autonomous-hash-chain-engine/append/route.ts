import { apiError, apiSuccess } from "@/src/server/api/response";
import { appendAutonomousHashChainRequest, requireAutonomousHashChainUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireAutonomousHashChainUser(); return apiSuccess(await appendAutonomousHashChainRequest(request)); }
  catch (error) { return apiError(error, "Unable to append Autonomous Hash Chain node."); }
}
