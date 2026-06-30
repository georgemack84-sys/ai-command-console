import { apiError, apiSuccess } from "@/src/server/api/response";
import { readAuditEvent, requireTruthDashboardUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireTruthDashboardUser();
    return apiSuccess(await readAuditEvent(request), { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to record Truth Dashboard audit event.");
  }
}
