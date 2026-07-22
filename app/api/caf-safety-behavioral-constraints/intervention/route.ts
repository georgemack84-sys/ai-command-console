import { apiError, apiSuccess } from "@/src/server/api/response";
import { interventionRequest, requireSafetyBehavioralConstraintUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSafetyBehavioralConstraintUser(); return apiSuccess(await interventionRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF safety intervention."); } }
export async function POST(request: Request) { try { await requireSafetyBehavioralConstraintUser(); return apiSuccess(await interventionRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF safety intervention."); } }
