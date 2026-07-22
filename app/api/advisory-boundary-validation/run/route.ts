import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAdvisoryBoundaryValidationUser, resultRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAdvisoryBoundaryValidationUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run advisory boundary validation."); } }
export async function POST(request: Request) { try { await requireAdvisoryBoundaryValidationUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run advisory boundary validation."); } }
