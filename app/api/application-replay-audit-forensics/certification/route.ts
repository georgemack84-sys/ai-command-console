import { apiError, apiSuccess } from "@/src/server/api/response";
import { certificationRequest, requireApplicationReplayAuditForensicsUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationReplayAuditForensicsUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to inspect replay audit forensics certification."); } }
export async function POST(request: Request) { try { await requireApplicationReplayAuditForensicsUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to inspect replay audit forensics certification."); } }
