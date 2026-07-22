import { operatorRequest, requireProductionObservabilityUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireProductionObservabilityUser(); return apiSuccess(await operatorRequest()); } catch (error) { return apiError(error, "Unable to load operator action ledger."); } }
export async function POST(request: Request) { try { await requireProductionObservabilityUser(); return apiSuccess(await operatorRequest(request)); } catch (error) { return apiError(error, "Unable to load operator action ledger."); } }
