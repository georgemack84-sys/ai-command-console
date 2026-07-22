import { pipelineRequest, requireProductionAdvisoryRuntimeUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireProductionAdvisoryRuntimeUser(); return apiSuccess(await pipelineRequest()); } catch (error) { return apiError(error, "Unable to load Production Advisory Runtime pipeline."); } }
export async function POST(request: Request) { try { await requireProductionAdvisoryRuntimeUser(); return apiSuccess(await pipelineRequest(request)); } catch (error) { return apiError(error, "Unable to load Production Advisory Runtime pipeline."); } }
