import { evidenceRequest, requireProductionOperationsObservabilityUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireProductionOperationsObservabilityUser(); return apiSuccess(await evidenceRequest()); } catch (error) { return apiError(error, "Unable to read operational evidence."); } }
export async function POST(request: Request) { try { await requireProductionOperationsObservabilityUser(); return apiSuccess(await evidenceRequest(request)); } catch (error) { return apiError(error, "Unable to read operational evidence."); } }
