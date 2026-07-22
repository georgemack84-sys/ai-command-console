import { apiError, apiSuccess } from "@/src/server/api/response";
import { certificationRequest, requireApplicationLifecycleCertificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationLifecycleCertificationUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to inspect application lifecycle certification."); } }
export async function POST(request: Request) { try { await requireApplicationLifecycleCertificationUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to inspect application lifecycle certification."); } }
