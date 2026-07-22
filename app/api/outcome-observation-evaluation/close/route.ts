import { apiError, apiSuccess } from "@/src/server/api/response";
import { closeRequest, requireOutcomeObservationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request) { try { await requireOutcomeObservationUser(); return apiSuccess(await closeRequest(request)); } catch (error) { return apiError(error, "Unable to close observation."); } }
