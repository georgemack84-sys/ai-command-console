import { apiError, apiSuccess } from "@/src/server/api/response";
import { complianceRequest, requireApplicationGovernanceBindingUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationGovernanceBindingUser(); return apiSuccess(await complianceRequest()); } catch (error) { return apiError(error, "Unable to inspect compliance reporting."); } }
export async function POST(request: Request) { try { await requireApplicationGovernanceBindingUser(); return apiSuccess(await complianceRequest(request)); } catch (error) { return apiError(error, "Unable to inspect compliance reporting."); } }
