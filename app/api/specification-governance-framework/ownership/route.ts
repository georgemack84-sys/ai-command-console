import { apiError, apiSuccess } from "@/src/server/api/response";
import { ownershipRequest, requireSpecificationGovernanceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSpecificationGovernanceUser(); return apiSuccess(await ownershipRequest()); } catch (error) { return apiError(error, "Unable to retrieve specification ownership registry."); } }
export async function POST(request: Request) { try { await requireSpecificationGovernanceUser(); return apiSuccess(await ownershipRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve specification ownership registry."); } }
