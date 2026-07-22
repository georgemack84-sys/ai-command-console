import { apiError, apiSuccess } from "@/src/server/api/response";
import { qualificationRequest, requireProductionEnvironmentQualificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireProductionEnvironmentQualificationUser(); return apiSuccess(await qualificationRequest()); } catch (error) { return apiError(error, "Unable to load environment qualification."); } }
export async function POST(request: Request) { try { await requireProductionEnvironmentQualificationUser(); return apiSuccess(await qualificationRequest(request)); } catch (error) { return apiError(error, "Unable to load environment qualification."); } }
