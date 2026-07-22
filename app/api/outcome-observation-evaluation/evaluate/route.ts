import { apiError, apiSuccess } from "@/src/server/api/response";
import { evaluateRequest, requireOutcomeObservationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireOutcomeObservationUser(); return apiSuccess(await evaluateRequest()); } catch (error) { return apiError(error, "Unable to evaluate recommendation outcome."); } }
export async function POST(request: Request) { try { await requireOutcomeObservationUser(); return apiSuccess(await evaluateRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate recommendation outcome."); } }
