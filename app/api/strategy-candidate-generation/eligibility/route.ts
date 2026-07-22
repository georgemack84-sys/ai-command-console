import { apiError, apiSuccess } from "@/src/server/api/response";
import { eligibilityRequest, requireStrategyCandidateUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategyCandidateUser(); return apiSuccess(await eligibilityRequest()); } catch (error) { return apiError(error, "Unable to validate candidate eligibility."); } }
export async function POST(request: Request) { try { await requireStrategyCandidateUser(); return apiSuccess(await eligibilityRequest(request)); } catch (error) { return apiError(error, "Unable to validate candidate eligibility."); } }
