import { apiError, apiSuccess } from "@/src/server/api/response";
import { dependenciesRequest, requirePortfolioAssessmentUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePortfolioAssessmentUser(); return apiSuccess(await dependenciesRequest()); } catch (error) { return apiError(error, "Unable to inspect portfolio dependencies."); } }
export async function POST(request: Request) { try { await requirePortfolioAssessmentUser(); return apiSuccess(await dependenciesRequest(request)); } catch (error) { return apiError(error, "Unable to inspect portfolio dependencies."); } }
