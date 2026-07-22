import { requireAdaptationQualificationUser, resultRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireAdaptationQualificationUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run Adaptation Qualification Service."); } }
export async function POST(request: Request) { try { await requireAdaptationQualificationUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run Adaptation Qualification Service."); } }
