import { apiError, apiSuccess } from "@/src/server/api/response";
import { createRequest, requireOutcomeObservationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireOutcomeObservationUser(); return apiSuccess(await createRequest()); } catch (error) { return apiError(error, "Unable to create outcome observation."); } }
export async function POST(request: Request) { try { await requireOutcomeObservationUser(); return apiSuccess(await createRequest(request)); } catch (error) { return apiError(error, "Unable to create outcome observation."); } }
