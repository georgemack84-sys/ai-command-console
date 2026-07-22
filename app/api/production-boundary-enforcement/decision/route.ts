import { apiError, apiSuccess } from "@/src/server/api/response";
import { decisionRequest, requireProductionBoundaryUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireProductionBoundaryUser(); return apiSuccess(await decisionRequest()); } catch (error) { return apiError(error, "Unable to load production boundary decision."); } }
export async function POST(request: Request) { try { await requireProductionBoundaryUser(); return apiSuccess(await decisionRequest(request)); } catch (error) { return apiError(error, "Unable to load production boundary decision."); } }
