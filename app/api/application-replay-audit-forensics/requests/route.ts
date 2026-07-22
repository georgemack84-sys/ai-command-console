import { apiError, apiSuccess } from "@/src/server/api/response";
import { requestsRequest, requireApplicationReplayAuditForensicsUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationReplayAuditForensicsUser(); return apiSuccess(await requestsRequest()); } catch (error) { return apiError(error, "Unable to inspect replay requests."); } }
export async function POST(request: Request) { try { await requireApplicationReplayAuditForensicsUser(); return apiSuccess(await requestsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect replay requests."); } }
