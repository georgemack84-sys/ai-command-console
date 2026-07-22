import { apiError, apiSuccess } from "@/src/server/api/response";
import { attestationRequest, requireProductionEnvironmentQualificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireProductionEnvironmentQualificationUser(); return apiSuccess(await attestationRequest()); } catch (error) { return apiError(error, "Unable to load environment attestation."); } }
export async function POST(request: Request) { try { await requireProductionEnvironmentQualificationUser(); return apiSuccess(await attestationRequest(request)); } catch (error) { return apiError(error, "Unable to load environment attestation."); } }
