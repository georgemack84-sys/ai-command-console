import { requireProductionCertificationUser, validationRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireProductionCertificationUser(); return apiSuccess(await validationRequest()); } catch (error) { return apiError(error, "Unable to load production certification validations."); } }
export async function POST(request: Request) { try { await requireProductionCertificationUser(); return apiSuccess(await validationRequest(request)); } catch (error) { return apiError(error, "Unable to load production certification validations."); } }
