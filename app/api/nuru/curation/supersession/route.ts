import { z } from "zod";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireNuruGovernor } from "@/src/server/api/nuru-api";
import { NuruSupersessionService } from "@/src/server/services/nuru-supersession-service";

export const dynamic = "force-dynamic";
const requestSchema = z.object({ currentItemId: z.string().min(1), candidateItemId: z.string().min(1), reason: z.string().trim().min(3).max(2_000) }).refine((value) => value.currentItemId !== value.candidateItemId, "Choose two different knowledge records.");

export async function GET() {
  try {
    await requireNuruGovernor();
    return apiSuccess(await NuruSupersessionService.list());
  } catch (error) {
    return apiError(error, "Unable to load Nuru supersession reviews.");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireNuruGovernor();
    const input = requestSchema.parse(await request.json());
    return apiSuccess(await NuruSupersessionService.request({ ...input, requestedBy: user.id, correlationId: crypto.randomUUID() }), { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to create the Nuru supersession review.");
  }
}
