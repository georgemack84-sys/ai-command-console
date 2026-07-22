import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildSubsystemHealthCollectionObservabilitySurface,
  collectSubsystemHealth,
  getSubsystemHealthCollectionEngineContract,
  replaySubsystemHealthCollection,
  validateSubsystemHealthCollection,
} from "@/services/subsystem-health-collection-engine";
import type { SubsystemHealthCollection, SubsystemHealthCollectionInput } from "@/types/subsystem-health-collection-engine";

export async function requireSubsystemHealthCollectionUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): SubsystemHealthCollectionInput {
  return body as SubsystemHealthCollectionInput;
}

function collectionFromBody(body: Record<string, unknown>): SubsystemHealthCollection {
  return (body.collection as SubsystemHealthCollection | undefined) ?? collectSubsystemHealth(inputFromBody(body));
}

export function contractResponse() { return getSubsystemHealthCollectionEngineContract(); }
export async function collectRequest(request: Request) { return collectSubsystemHealth(inputFromBody(await readBody(request))); }
export async function recordsRequest(request: Request) { return collectionFromBody(await readBody(request)).subsystems; }
export async function normalizedRequest(request: Request) { return collectionFromBody(await readBody(request)).normalized_metrics; }
export async function evidenceRequest(request: Request) { return collectionFromBody(await readBody(request)).evidence_references; }
export async function alertsRequest(request: Request) { return collectionFromBody(await readBody(request)).subsystems.flatMap((item) => item.alerts); }
export async function anomaliesRequest(request: Request) { return collectionFromBody(await readBody(request)).subsystems.flatMap((item) => item.anomalies); }
export async function failuresRequest(request: Request) { return collectionFromBody(await readBody(request)).subsystems.flatMap((item) => item.failures); }
export async function replayRequest(request: Request) { return replaySubsystemHealthCollection(collectionFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateSubsystemHealthCollection(collectionFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildSubsystemHealthCollectionObservabilitySurface();
  return buildSubsystemHealthCollectionObservabilitySurface(collectionFromBody(await readBody(request)));
}
