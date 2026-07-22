import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireProductionReadinessFoundationUser, rollbackRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireProductionReadinessFoundationUser(); return apiSuccess(await rollbackRequest()); } catch (error) { return apiError(error, "Unable to load production rollback requirements."); } }
export async function POST(request: Request) { try { await requireProductionReadinessFoundationUser(); return apiSuccess(await rollbackRequest(request)); } catch (error) { return apiError(error, "Unable to load production rollback requirements."); } }
