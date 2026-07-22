import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAdvisoryBoundaryValidationUser, violationsRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAdvisoryBoundaryValidationUser(); return apiSuccess(await violationsRequest()); } catch (error) { return apiError(error, "Unable to load advisory boundary violations."); } }
export async function POST(request: Request) { try { await requireAdvisoryBoundaryValidationUser(); return apiSuccess(await violationsRequest(request)); } catch (error) { return apiError(error, "Unable to load advisory boundary violations."); } }
