import { apiError, apiSuccess } from "@/src/server/api/response";
import { attacksRequest, requireAdvisoryBoundaryValidationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAdvisoryBoundaryValidationUser(); return apiSuccess(await attacksRequest()); } catch (error) { return apiError(error, "Unable to load advisory boundary attacks."); } }
export async function POST(request: Request) { try { await requireAdvisoryBoundaryValidationUser(); return apiSuccess(await attacksRequest(request)); } catch (error) { return apiError(error, "Unable to load advisory boundary attacks."); } }
