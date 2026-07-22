import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceRequest, requireApplicationLifecycleCertificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationLifecycleCertificationUser(); return apiSuccess(await governanceRequest()); } catch (error) { return apiError(error, "Unable to inspect certification governance."); } }
export async function POST(request: Request) { try { await requireApplicationLifecycleCertificationUser(); return apiSuccess(await governanceRequest(request)); } catch (error) { return apiError(error, "Unable to inspect certification governance."); } }
