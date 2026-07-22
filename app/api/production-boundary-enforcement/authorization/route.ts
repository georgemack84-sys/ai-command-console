import { apiError, apiSuccess } from "@/src/server/api/response";
import { authorizationRequest, requireProductionBoundaryUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireProductionBoundaryUser(); return apiSuccess(await authorizationRequest()); } catch (error) { return apiError(error, "Unable to load production boundary authorization."); } }
export async function POST(request: Request) { try { await requireProductionBoundaryUser(); return apiSuccess(await authorizationRequest(request)); } catch (error) { return apiError(error, "Unable to load production boundary authorization."); } }
