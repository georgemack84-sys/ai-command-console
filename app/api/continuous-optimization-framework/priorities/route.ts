import { prioritiesRequest, requireContinuousOptimizationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireContinuousOptimizationUser(); return apiSuccess(await prioritiesRequest()); } catch (error) { return apiError(error, "Unable to read optimization priorities."); } }
export async function POST(request: Request) { try { await requireContinuousOptimizationUser(); return apiSuccess(await prioritiesRequest(request)); } catch (error) { return apiError(error, "Unable to read optimization priorities."); } }
