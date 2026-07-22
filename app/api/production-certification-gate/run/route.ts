import { requireProductionCertificationUser, resultRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireProductionCertificationUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run Production Certification Gate."); } }
export async function POST(request: Request) { try { await requireProductionCertificationUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run Production Certification Gate."); } }
