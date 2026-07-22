import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireOutcomeObservationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireOutcomeObservationUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect outcome observation contract."); } }
