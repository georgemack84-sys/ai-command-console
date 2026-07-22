import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireProductionEnvironmentQualificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireProductionEnvironmentQualificationUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to load production environment qualification contract."); } }
