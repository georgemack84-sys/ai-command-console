import { certificationRequest, requireAdaptationQualificationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireAdaptationQualificationUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to read qualification certification."); } }
export async function POST(request: Request) { try { await requireAdaptationQualificationUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to read qualification certification."); } }
