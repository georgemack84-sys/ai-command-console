import { requirePerformanceScalabilityValidationUser, throughputRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePerformanceScalabilityValidationUser(); return apiSuccess(await throughputRequest()); } catch (error) { return apiError(error, "Unable to read throughput validation."); } }
export async function POST(request: Request) { try { await requirePerformanceScalabilityValidationUser(); return apiSuccess(await throughputRequest(request)); } catch (error) { return apiError(error, "Unable to read throughput validation."); } }
