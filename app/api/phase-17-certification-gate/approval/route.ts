import { approvalRequest, requirePhase17CertificationGateUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePhase17CertificationGateUser(); return apiSuccess(await approvalRequest()); } catch (error) { return apiError(error, "Unable to read Phase 17 production approval."); } }
export async function POST(request: Request) { try { await requirePhase17CertificationGateUser(); return apiSuccess(await approvalRequest(request)); } catch (error) { return apiError(error, "Unable to read Phase 17 production approval."); } }
