import { evidenceRequest, requirePerformanceScalabilityValidationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePerformanceScalabilityValidationUser(); return apiSuccess(await evidenceRequest()); } catch (error) { return apiError(error, "Unable to read performance evidence."); } }
export async function POST(request: Request) { try { await requirePerformanceScalabilityValidationUser(); return apiSuccess(await evidenceRequest(request)); } catch (error) { return apiError(error, "Unable to read performance evidence."); } }
