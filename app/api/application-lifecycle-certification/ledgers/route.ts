import { apiError, apiSuccess } from "@/src/server/api/response";
import { ledgersRequest, requireApplicationLifecycleCertificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationLifecycleCertificationUser(); return apiSuccess(await ledgersRequest()); } catch (error) { return apiError(error, "Unable to inspect lifecycle certification ledgers."); } }
export async function POST(request: Request) { try { await requireApplicationLifecycleCertificationUser(); return apiSuccess(await ledgersRequest(request)); } catch (error) { return apiError(error, "Unable to inspect lifecycle certification ledgers."); } }
