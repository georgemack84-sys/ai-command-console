import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAdvisoryBoundaryValidationUser, validationRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAdvisoryBoundaryValidationUser(); return apiSuccess(await validationRequest()); } catch (error) { return apiError(error, "Unable to load advisory boundary validation report."); } }
export async function POST(request: Request) { try { await requireAdvisoryBoundaryValidationUser(); return apiSuccess(await validationRequest(request)); } catch (error) { return apiError(error, "Unable to load advisory boundary validation report."); } }
