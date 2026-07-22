import { apiError, apiSuccess } from "@/src/server/api/response";
import { assessRequest, requirePortfolioAssessmentUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePortfolioAssessmentUser(); return apiSuccess(await assessRequest()); } catch (error) { return apiError(error, "Unable to assess portfolio."); } }
export async function POST(request: Request) { try { await requirePortfolioAssessmentUser(); return apiSuccess(await assessRequest(request)); } catch (error) { return apiError(error, "Unable to assess portfolio."); } }
