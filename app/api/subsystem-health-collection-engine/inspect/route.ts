import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireSubsystemHealthCollectionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSubsystemHealthCollectionUser();
    return apiSuccess(await inspectRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect subsystem health collection.");
  }
}

export async function POST(request: Request) {
  try {
    await requireSubsystemHealthCollectionUser();
    return apiSuccess(await inspectRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect subsystem health collection.");
  }
}
