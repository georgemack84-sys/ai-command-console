import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireHumanOperatorInteractionUser, sequenceRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireHumanOperatorInteractionUser(); return apiSuccess(await sequenceRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF runtime execution sequence."); } }
export async function POST(request: Request) { try { await requireHumanOperatorInteractionUser(); return apiSuccess(await sequenceRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF runtime execution sequence."); } }
