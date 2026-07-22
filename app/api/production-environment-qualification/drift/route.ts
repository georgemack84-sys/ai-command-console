import { apiError, apiSuccess } from "@/src/server/api/response";
import { driftRequest, requireProductionEnvironmentQualificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireProductionEnvironmentQualificationUser(); return apiSuccess(await driftRequest()); } catch (error) { return apiError(error, "Unable to load environment drift validation."); } }
export async function POST(request: Request) { try { await requireProductionEnvironmentQualificationUser(); return apiSuccess(await driftRequest(request)); } catch (error) { return apiError(error, "Unable to load environment drift validation."); } }
