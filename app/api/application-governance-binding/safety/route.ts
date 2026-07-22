import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireApplicationGovernanceBindingUser, safetyRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationGovernanceBindingUser(); return apiSuccess(await safetyRequest()); } catch (error) { return apiError(error, "Unable to inspect safety compliance."); } }
export async function POST(request: Request) { try { await requireApplicationGovernanceBindingUser(); return apiSuccess(await safetyRequest(request)); } catch (error) { return apiError(error, "Unable to inspect safety compliance."); } }
