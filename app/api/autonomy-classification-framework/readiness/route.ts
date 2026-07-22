import { apiError, apiSuccess } from "@/src/server/api/response";
import { readinessRequest, requireAutonomyClassificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAutonomyClassificationUser(); return apiSuccess(await readinessRequest()); } catch (error) { return apiError(error, "Unable to inspect Autonomy Classification Framework readiness."); } }
export async function POST(request: Request) { try { await requireAutonomyClassificationUser(); return apiSuccess(await readinessRequest(request)); } catch (error) { return apiError(error, "Unable to project Autonomy Classification Framework readiness."); } }
