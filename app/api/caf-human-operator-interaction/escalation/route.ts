import { apiError, apiSuccess } from "@/src/server/api/response";
import { escalationRequest, requireHumanOperatorInteractionUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireHumanOperatorInteractionUser(); return apiSuccess(await escalationRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF operator escalation."); } }
export async function POST(request: Request) { try { await requireHumanOperatorInteractionUser(); return apiSuccess(await escalationRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF operator escalation."); } }
