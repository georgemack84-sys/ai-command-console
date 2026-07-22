import { apiError, apiSuccess } from "@/src/server/api/response";
import { eligibilityRequest, requireAutonomyClassificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAutonomyClassificationUser(); return apiSuccess(await eligibilityRequest()); } catch (error) { return apiError(error, "Unable to inspect autonomy eligibility."); } }
export async function POST(request: Request) { try { await requireAutonomyClassificationUser(); return apiSuccess(await eligibilityRequest(request)); } catch (error) { return apiError(error, "Unable to project autonomy eligibility."); } }
