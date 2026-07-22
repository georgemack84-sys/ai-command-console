import { policyRequest, requireAdaptationQualificationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireAdaptationQualificationUser(); return apiSuccess(await policyRequest()); } catch (error) { return apiError(error, "Unable to read qualification policy."); } }
export async function POST(request: Request) { try { await requireAdaptationQualificationUser(); return apiSuccess(await policyRequest(request)); } catch (error) { return apiError(error, "Unable to read qualification policy."); } }
