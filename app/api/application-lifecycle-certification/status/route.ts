import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireApplicationLifecycleCertificationUser, statusRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationLifecycleCertificationUser(); return apiSuccess(await statusRequest()); } catch (error) { return apiError(error, "Unable to inspect certification status."); } }
export async function POST(request: Request) { try { await requireApplicationLifecycleCertificationUser(); return apiSuccess(await statusRequest(request)); } catch (error) { return apiError(error, "Unable to inspect certification status."); } }
