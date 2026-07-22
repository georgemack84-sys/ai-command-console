import { observabilityRequest, requireContinuousOptimizationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireContinuousOptimizationUser(); return apiSuccess(await observabilityRequest()); } catch (error) { return apiError(error, "Unable to read optimization observability."); } }
export async function POST(request: Request) { try { await requireContinuousOptimizationUser(); return apiSuccess(await observabilityRequest(request)); } catch (error) { return apiError(error, "Unable to read optimization observability."); } }
