import { advisoryRequest, requirePortfolioAssessmentUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePortfolioAssessmentUser(); return apiSuccess(await advisoryRequest()); } catch (error) { return apiError(error, "Unable to inspect portfolio advisory output."); } }
export async function POST(request: Request) { try { await requirePortfolioAssessmentUser(); return apiSuccess(await advisoryRequest(request)); } catch (error) { return apiError(error, "Unable to inspect portfolio advisory output."); } }
