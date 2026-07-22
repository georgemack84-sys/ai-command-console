import { evidenceRequest, requireAdaptationQualificationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireAdaptationQualificationUser(); return apiSuccess(await evidenceRequest()); } catch (error) { return apiError(error, "Unable to read qualification evidence."); } }
export async function POST(request: Request) { try { await requireAdaptationQualificationUser(); return apiSuccess(await evidenceRequest(request)); } catch (error) { return apiError(error, "Unable to read qualification evidence."); } }
