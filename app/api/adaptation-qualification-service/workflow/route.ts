import { requireAdaptationQualificationUser, workflowRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireAdaptationQualificationUser(); return apiSuccess(await workflowRequest()); } catch (error) { return apiError(error, "Unable to read qualification workflow."); } }
export async function POST(request: Request) { try { await requireAdaptationQualificationUser(); return apiSuccess(await workflowRequest(request)); } catch (error) { return apiError(error, "Unable to read qualification workflow."); } }
