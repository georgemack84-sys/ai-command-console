import { certificationRequest, requireProductionOperationsObservabilityUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireProductionOperationsObservabilityUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to read monitoring certification."); } }
export async function POST(request: Request) { try { await requireProductionOperationsObservabilityUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to read monitoring certification."); } }
