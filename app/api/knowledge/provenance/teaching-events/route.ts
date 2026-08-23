import { z } from "zod";

import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { PrismaProvenanceLedger, TeachingEventCaptureService } from "@/services/learning-constitution";

const identifiedScope = z.object({
  type: z.enum(["CONVERSATION", "SESSION", "USER", "AGENT", "PROJECT", "WORKSPACE", "ORGANIZATION", "DOMAIN", "COMPONENT", "TASK"]),
  id: z.string().min(1).max(256),
  displayName: z.string().min(1).max(256).optional(),
}).strict();
const rootScope = z.object({ type: z.enum(["SYSTEM", "GLOBAL"]), displayName: z.string().min(1).max(256).optional() }).strict();
const requestSchema = z.object({
  sourceType: z.enum(["CONVERSATION", "DOCUMENT", "HUMAN_ENTRY", "APPROVED_REFERENCE", "IMPORT"]),
  originalContent: z.string().min(1).max(100_000),
  receivedAt: z.string().datetime().optional(),
  scopeHint: z.union([identifiedScope, rootScope]).optional(),
}).strict();

/** Captures an authenticated human's supplied material before any interpretation. */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    if (!user.workspaceId || user.workspaceId === "default") throw new AppError(403, "workspace_required", "A workspace membership is required to capture provenance.");
    const input = requestSchema.parse(await request.json());
    const result = await new TeachingEventCaptureService({ ledger: new PrismaProvenanceLedger(user.workspaceId) }).capture({
      ...input,
      sourceActor: { actorId: `user:${user.id}`, actorType: "HUMAN" },
    });
    if (result.status !== "CAPTURED") {
      throw new AppError(503, "provenance_capture_failed", "Noesis could not durably capture the teaching event.", { reasonCode: result.reasonCode });
    }
    return apiSuccess({ teachingEvent: result.teachingEvent }, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to capture the teaching event.");
  }
}
