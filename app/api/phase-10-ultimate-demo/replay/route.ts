import { replayPhase10UltimateDemo, runPhase10UltimateDemo } from "@/services/phase-10-ultimate-demo";
import { apiError, apiSuccess } from "@/src/server/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = runPhase10UltimateDemo();
    return apiSuccess({ replay_valid: replayPhase10UltimateDemo(result), replay_hash: result.replay.replay_hash, deterministic_hash: result.deterministic_hash, divergence: result.replay.divergence });
  } catch (error) {
    return apiError(error, "Unable to replay Phase 10 ultimate demo.");
  }
}
