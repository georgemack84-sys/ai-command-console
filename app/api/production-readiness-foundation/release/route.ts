import { apiError, apiSuccess } from "@/src/server/api/response";
import { releaseRequest, requireProductionReadinessFoundationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireProductionReadinessFoundationUser(); return apiSuccess(await releaseRequest()); } catch (error) { return apiError(error, "Unable to load production release identity."); } }
export async function POST(request: Request) { try { await requireProductionReadinessFoundationUser(); return apiSuccess(await releaseRequest(request)); } catch (error) { return apiError(error, "Unable to load production release identity."); } }
