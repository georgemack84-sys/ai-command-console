import { candidatesRequest, requireContinuousOptimizationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireContinuousOptimizationUser(); return apiSuccess(await candidatesRequest()); } catch (error) { return apiError(error, "Unable to read optimization candidates."); } }
export async function POST(request: Request) { try { await requireContinuousOptimizationUser(); return apiSuccess(await candidatesRequest(request)); } catch (error) { return apiError(error, "Unable to read optimization candidates."); } }
