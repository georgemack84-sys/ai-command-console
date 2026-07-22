import { apiError, apiSuccess } from "@/src/server/api/response";
import { qualifyRequest, requireOutcomeObservationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireOutcomeObservationUser(); return apiSuccess(await qualifyRequest()); } catch (error) { return apiError(error, "Unable to qualify observation."); } }
export async function POST(request: Request) { try { await requireOutcomeObservationUser(); return apiSuccess(await qualifyRequest(request)); } catch (error) { return apiError(error, "Unable to qualify observation."); } }
