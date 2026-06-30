import { apiError, apiSuccess } from "@/src/server/api/response";
import { readVisibilityCertificationRun, requireVisibilityCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireVisibilityCertificationUser();
    return apiSuccess(await readVisibilityCertificationRun(request), { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to run visibility certification.");
  }
}
