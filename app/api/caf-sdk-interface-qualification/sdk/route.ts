import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireSdkInterfaceQualificationUser, sdkRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSdkInterfaceQualificationUser(); return apiSuccess(await sdkRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF SDK validation."); } }
export async function POST(request: Request) { try { await requireSdkInterfaceQualificationUser(); return apiSuccess(await sdkRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF SDK validation."); } }
