import { apiError, apiSuccess } from "@/src/server/api/response";
import { integrityRequest, requireSpecificationGovernanceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSpecificationGovernanceUser(); return apiSuccess(await integrityRequest()); } catch (error) { return apiError(error, "Unable to retrieve specification integrity validation."); } }
export async function POST(request: Request) { try { await requireSpecificationGovernanceUser(); return apiSuccess(await integrityRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve specification integrity validation."); } }
