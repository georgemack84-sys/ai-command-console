import { latencyRequest, requirePerformanceScalabilityValidationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePerformanceScalabilityValidationUser(); return apiSuccess(await latencyRequest()); } catch (error) { return apiError(error, "Unable to read latency analysis."); } }
export async function POST(request: Request) { try { await requirePerformanceScalabilityValidationUser(); return apiSuccess(await latencyRequest(request)); } catch (error) { return apiError(error, "Unable to read latency analysis."); } }
