import { apiError, apiSuccess } from "@/src/server/api/response";
import { readVisibilityAuditEvent, requireVisibilityCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireVisibilityCertificationUser();
    return apiSuccess(await readVisibilityAuditEvent(request), { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to record visibility certification audit event.");
  }
}
