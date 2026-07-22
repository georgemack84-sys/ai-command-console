import { frameworkRequest, requirePerformanceScalabilityValidationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePerformanceScalabilityValidationUser(); return apiSuccess(await frameworkRequest()); } catch (error) { return apiError(error, "Unable to read scalability framework."); } }
export async function POST(request: Request) { try { await requirePerformanceScalabilityValidationUser(); return apiSuccess(await frameworkRequest(request)); } catch (error) { return apiError(error, "Unable to read scalability framework."); } }
