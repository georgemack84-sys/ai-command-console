import { apiError, apiSuccess } from "@/src/server/api/response";
import { certificationRequest, requireSpecificationGovernanceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSpecificationGovernanceUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to retrieve specification governance certification."); } }
export async function POST(request: Request) { try { await requireSpecificationGovernanceUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve specification governance certification."); } }
