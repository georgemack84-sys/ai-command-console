import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireProductionEnvironmentQualificationUser, resultRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireProductionEnvironmentQualificationUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run production environment qualification."); } }
export async function POST(request: Request) { try { await requireProductionEnvironmentQualificationUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run production environment qualification."); } }
