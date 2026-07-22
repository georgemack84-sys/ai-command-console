import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRequest, requirePortfolioAssessmentUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePortfolioAssessmentUser(); return apiSuccess(await replayRequest()); } catch (error) { return apiError(error, "Unable to replay portfolio assessment."); } }
export async function POST(request: Request) { try { await requirePortfolioAssessmentUser(); return apiSuccess(await replayRequest(request)); } catch (error) { return apiError(error, "Unable to replay portfolio assessment."); } }
