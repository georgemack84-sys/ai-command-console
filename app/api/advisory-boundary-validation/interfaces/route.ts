import { apiError, apiSuccess } from "@/src/server/api/response";
import { interfacesRequest, requireAdvisoryBoundaryValidationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAdvisoryBoundaryValidationUser(); return apiSuccess(await interfacesRequest()); } catch (error) { return apiError(error, "Unable to load advisory interface protection."); } }
export async function POST(request: Request) { try { await requireAdvisoryBoundaryValidationUser(); return apiSuccess(await interfacesRequest(request)); } catch (error) { return apiError(error, "Unable to load advisory interface protection."); } }
