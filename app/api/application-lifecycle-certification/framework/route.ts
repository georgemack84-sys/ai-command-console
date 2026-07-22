import { apiError, apiSuccess } from "@/src/server/api/response";
import { frameworkRequest, requireApplicationLifecycleCertificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationLifecycleCertificationUser(); return apiSuccess(await frameworkRequest()); } catch (error) { return apiError(error, "Unable to inspect certification framework."); } }
export async function POST(request: Request) { try { await requireApplicationLifecycleCertificationUser(); return apiSuccess(await frameworkRequest(request)); } catch (error) { return apiError(error, "Unable to inspect certification framework."); } }
