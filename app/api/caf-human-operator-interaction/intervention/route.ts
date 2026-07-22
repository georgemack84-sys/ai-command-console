import { apiError, apiSuccess } from "@/src/server/api/response";
import { interventionRequest, requireHumanOperatorInteractionUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireHumanOperatorInteractionUser(); return apiSuccess(await interventionRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF operator intervention."); } }
export async function POST(request: Request) { try { await requireHumanOperatorInteractionUser(); return apiSuccess(await interventionRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF operator intervention."); } }
