import { recommendationRequest, requireProductionAdvisoryRuntimeUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireProductionAdvisoryRuntimeUser(); return apiSuccess(await recommendationRequest()); } catch (error) { return apiError(error, "Unable to load Production Advisory Runtime recommendation."); } }
export async function POST(request: Request) { try { await requireProductionAdvisoryRuntimeUser(); return apiSuccess(await recommendationRequest(request)); } catch (error) { return apiError(error, "Unable to load Production Advisory Runtime recommendation."); } }
