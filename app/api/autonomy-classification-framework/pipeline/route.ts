import { apiError, apiSuccess } from "@/src/server/api/response";
import { pipelineRequest, requireAutonomyClassificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAutonomyClassificationUser(); return apiSuccess(await pipelineRequest()); } catch (error) { return apiError(error, "Unable to inspect autonomy classification pipeline."); } }
export async function POST(request: Request) { try { await requireAutonomyClassificationUser(); return apiSuccess(await pipelineRequest(request)); } catch (error) { return apiError(error, "Unable to project autonomy classification pipeline."); } }
