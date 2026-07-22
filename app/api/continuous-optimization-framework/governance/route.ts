import { governanceRequest, requireContinuousOptimizationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireContinuousOptimizationUser(); return apiSuccess(await governanceRequest()); } catch (error) { return apiError(error, "Unable to read optimization governance."); } }
export async function POST(request: Request) { try { await requireContinuousOptimizationUser(); return apiSuccess(await governanceRequest(request)); } catch (error) { return apiError(error, "Unable to read optimization governance."); } }
