import { requireAdaptationQualificationUser, serviceRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireAdaptationQualificationUser(); return apiSuccess(await serviceRequest()); } catch (error) { return apiError(error, "Unable to read qualification service."); } }
export async function POST(request: Request) { try { await requireAdaptationQualificationUser(); return apiSuccess(await serviceRequest(request)); } catch (error) { return apiError(error, "Unable to read qualification service."); } }
