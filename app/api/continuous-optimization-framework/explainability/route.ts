import { explainabilityRequest, requireContinuousOptimizationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireContinuousOptimizationUser(); return apiSuccess(await explainabilityRequest()); } catch (error) { return apiError(error, "Unable to read optimization explainability."); } }
export async function POST(request: Request) { try { await requireContinuousOptimizationUser(); return apiSuccess(await explainabilityRequest(request)); } catch (error) { return apiError(error, "Unable to read optimization explainability."); } }
