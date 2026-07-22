import { certificationRequest, requireProductionAdvisoryRuntimeUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireProductionAdvisoryRuntimeUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to load Production Advisory Runtime certification."); } }
export async function POST(request: Request) { try { await requireProductionAdvisoryRuntimeUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to load Production Advisory Runtime certification."); } }
