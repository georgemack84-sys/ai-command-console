import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireSpecificationGovernanceUser, resultRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSpecificationGovernanceUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run specification governance framework."); } }
export async function POST(request: Request) { try { await requireSpecificationGovernanceUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run specification governance framework."); } }
