import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildViolationPatternDoctrine,
  buildViolationPatternObservabilitySurface,
  buildViolationPatternRecord,
  computeViolationPatternHash,
  detectViolationPatterns,
  normalizePatternInputs,
  replayViolationPattern,
  resolveComparisonWindow,
  resolveViolationPatternWindow,
  transitionViolationPatternState,
  validateViolationPatternRecord,
} from "@/services/violation-patterns";
import type { ViolationPatternRecord, ViolationPatternState } from "@/types/violation-patterns";

export async function requireViolationPatternUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getViolationPatternContract() {
  return {
    doctrine: buildViolationPatternDoctrine(),
    windows: {
      current: resolveViolationPatternWindow(),
      comparison: resolveComparisonWindow(resolveViolationPatternWindow()),
    },
    record: buildViolationPatternRecord(),
  };
}

export async function detectViolationPatternRequest(request: Request) {
  const body = await readBody(request);
  return detectViolationPatterns(body);
}

export async function normalizeViolationPatternRequest(request: Request) {
  const body = await readBody(request) as { events?: Parameters<typeof normalizePatternInputs>[0] };
  return { normalized_events: normalizePatternInputs(body.events) };
}

export async function validateViolationPatternRequest(request: Request) {
  const body = await readBody(request);
  return validateViolationPatternRecord(Object.keys(body).length ? body as Partial<ViolationPatternRecord> : buildViolationPatternRecord());
}

export async function replayViolationPatternRequest(request: Request) {
  const body = await readBody(request);
  return replayViolationPattern(Object.keys(body).length ? buildViolationPatternRecord(body as Partial<ViolationPatternRecord>) : buildViolationPatternRecord());
}

export async function transitionViolationPatternRequest(request: Request) {
  const body = await readBody(request) as { record?: Partial<ViolationPatternRecord>; to_state?: ViolationPatternState };
  return transitionViolationPatternState(buildViolationPatternRecord(body.record ?? {}), body.to_state ?? "LINKED_TO_RISK");
}

export async function hashViolationPatternRequest(request: Request) {
  const body = await readBody(request);
  const record = Object.keys(body).length ? buildViolationPatternRecord(body as Partial<ViolationPatternRecord>) : buildViolationPatternRecord();
  return { violation_pattern_hash: computeViolationPatternHash(record) };
}

export async function inspectViolationPatternRequest(request?: Request) {
  if (!request) return buildViolationPatternObservabilitySurface();
  const body = await readBody(request);
  return buildViolationPatternObservabilitySurface(Object.keys(body).length ? buildViolationPatternRecord(body as Partial<ViolationPatternRecord>) : buildViolationPatternRecord());
}
