import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireOutcomeObservationUser, windowRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireOutcomeObservationUser(); return apiSuccess(await windowRequest()); } catch (error) { return apiError(error, "Unable to inspect observation window."); } }
export async function POST(request: Request) { try { await requireOutcomeObservationUser(); return apiSuccess(await windowRequest(request)); } catch (error) { return apiError(error, "Unable to inspect observation window."); } }
