import { certificationRequest, requirePerformanceScalabilityValidationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePerformanceScalabilityValidationUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to read scalability certification."); } }
export async function POST(request: Request) { try { await requirePerformanceScalabilityValidationUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to read scalability certification."); } }
