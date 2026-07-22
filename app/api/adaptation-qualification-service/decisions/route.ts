import { decisionsRequest, requireAdaptationQualificationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireAdaptationQualificationUser(); return apiSuccess(await decisionsRequest()); } catch (error) { return apiError(error, "Unable to read qualification decisions."); } }
export async function POST(request: Request) { try { await requireAdaptationQualificationUser(); return apiSuccess(await decisionsRequest(request)); } catch (error) { return apiError(error, "Unable to read qualification decisions."); } }
