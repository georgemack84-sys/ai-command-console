import { evidenceRequest, requireProductionCertificationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireProductionCertificationUser(); return apiSuccess(await evidenceRequest()); } catch (error) { return apiError(error, "Unable to load production certification evidence."); } }
export async function POST(request: Request) { try { await requireProductionCertificationUser(); return apiSuccess(await evidenceRequest(request)); } catch (error) { return apiError(error, "Unable to load production certification evidence."); } }
