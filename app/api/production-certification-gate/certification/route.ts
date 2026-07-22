import { certificationRequest, requireProductionCertificationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireProductionCertificationUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to load production certification tests."); } }
export async function POST(request: Request) { try { await requireProductionCertificationUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to load production certification tests."); } }
