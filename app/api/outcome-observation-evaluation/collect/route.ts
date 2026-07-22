import { collectRequest, requireOutcomeObservationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireOutcomeObservationUser(); return apiSuccess(await collectRequest()); } catch (error) { return apiError(error, "Unable to collect observation evidence."); } }
export async function POST(request: Request) { try { await requireOutcomeObservationUser(); return apiSuccess(await collectRequest(request)); } catch (error) { return apiError(error, "Unable to collect observation evidence."); } }
