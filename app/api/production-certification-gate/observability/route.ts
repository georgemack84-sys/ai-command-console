import { observabilityRequest, requireProductionCertificationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireProductionCertificationUser(); return apiSuccess(await observabilityRequest()); } catch (error) { return apiError(error, "Unable to load production certification observability."); } }
export async function POST(request: Request) { try { await requireProductionCertificationUser(); return apiSuccess(await observabilityRequest(request)); } catch (error) { return apiError(error, "Unable to load production certification observability."); } }
