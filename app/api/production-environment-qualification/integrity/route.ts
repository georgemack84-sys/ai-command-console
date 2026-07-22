import { apiError, apiSuccess } from "@/src/server/api/response";
import { integrityRequest, requireProductionEnvironmentQualificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireProductionEnvironmentQualificationUser(); return apiSuccess(await integrityRequest()); } catch (error) { return apiError(error, "Unable to load environment integrity."); } }
export async function POST(request: Request) { try { await requireProductionEnvironmentQualificationUser(); return apiSuccess(await integrityRequest(request)); } catch (error) { return apiError(error, "Unable to load environment integrity."); } }
