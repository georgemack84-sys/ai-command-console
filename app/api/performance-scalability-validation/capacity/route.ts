import { capacityRequest, requirePerformanceScalabilityValidationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePerformanceScalabilityValidationUser(); return apiSuccess(await capacityRequest()); } catch (error) { return apiError(error, "Unable to read capacity validation."); } }
export async function POST(request: Request) { try { await requirePerformanceScalabilityValidationUser(); return apiSuccess(await capacityRequest(request)); } catch (error) { return apiError(error, "Unable to read capacity validation."); } }
