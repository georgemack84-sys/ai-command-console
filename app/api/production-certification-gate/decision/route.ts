import { decisionRequest, requireProductionCertificationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireProductionCertificationUser(); return apiSuccess(await decisionRequest()); } catch (error) { return apiError(error, "Unable to load production certification decision."); } }
export async function POST(request: Request) { try { await requireProductionCertificationUser(); return apiSuccess(await decisionRequest(request)); } catch (error) { return apiError(error, "Unable to load production certification decision."); } }
