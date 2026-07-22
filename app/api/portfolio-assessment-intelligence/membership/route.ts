import { apiError, apiSuccess } from "@/src/server/api/response";
import { membershipRequest, requirePortfolioAssessmentUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePortfolioAssessmentUser(); return apiSuccess(await membershipRequest()); } catch (error) { return apiError(error, "Unable to inspect portfolio membership."); } }
export async function POST(request: Request) { try { await requirePortfolioAssessmentUser(); return apiSuccess(await membershipRequest(request)); } catch (error) { return apiError(error, "Unable to inspect portfolio membership."); } }
