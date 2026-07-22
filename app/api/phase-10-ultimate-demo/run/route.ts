import { runPhase10UltimateDemo } from "@/services/phase-10-ultimate-demo";
import { apiError, apiSuccess } from "@/src/server/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return apiSuccess(runPhase10UltimateDemo());
  } catch (error) {
    return apiError(error, "Unable to run Phase 10 ultimate demo.");
  }
}

export async function POST() {
  try {
    return apiSuccess(runPhase10UltimateDemo());
  } catch (error) {
    return apiError(error, "Unable to run Phase 10 ultimate demo.");
  }
}
