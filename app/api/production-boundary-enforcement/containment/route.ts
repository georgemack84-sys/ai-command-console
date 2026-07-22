import { apiError, apiSuccess } from "@/src/server/api/response";
import { containmentRequest, requireProductionBoundaryUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireProductionBoundaryUser(); return apiSuccess(await containmentRequest()); } catch (error) { return apiError(error, "Unable to load production boundary containment."); } }
export async function POST(request: Request) { try { await requireProductionBoundaryUser(); return apiSuccess(await containmentRequest(request)); } catch (error) { return apiError(error, "Unable to load production boundary containment."); } }
