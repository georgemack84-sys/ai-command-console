import { apiError, apiSuccess } from "@/src/server/api/response";
import { interactionRequest, requireHumanOperatorInteractionUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireHumanOperatorInteractionUser(); return apiSuccess(await interactionRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF operator interaction."); } }
export async function POST(request: Request) { try { await requireHumanOperatorInteractionUser(); return apiSuccess(await interactionRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF operator interaction."); } }
