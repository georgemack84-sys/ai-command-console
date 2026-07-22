import { apiError, apiSuccess } from "@/src/server/api/response";
import { guardRequest, requireAdvisoryBoundaryValidationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAdvisoryBoundaryValidationUser(); return apiSuccess(await guardRequest()); } catch (error) { return apiError(error, "Unable to load advisory boundary guard."); } }
export async function POST(request: Request) { try { await requireAdvisoryBoundaryValidationUser(); return apiSuccess(await guardRequest(request)); } catch (error) { return apiError(error, "Unable to load advisory boundary guard."); } }
