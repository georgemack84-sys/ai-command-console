import { apiError, apiSuccess } from "@/src/server/api/response";
import { certificationRequest, requireProductionEnvironmentQualificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireProductionEnvironmentQualificationUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to load environment certification."); } }
export async function POST(request: Request) { try { await requireProductionEnvironmentQualificationUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to load environment certification."); } }
