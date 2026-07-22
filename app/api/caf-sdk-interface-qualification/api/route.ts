import { apiError, apiSuccess } from "@/src/server/api/response";
import { apiRequest, requireSdkInterfaceQualificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSdkInterfaceQualificationUser(); return apiSuccess(await apiRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF API validation."); } }
export async function POST(request: Request) { try { await requireSdkInterfaceQualificationUser(); return apiSuccess(await apiRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF API validation."); } }
