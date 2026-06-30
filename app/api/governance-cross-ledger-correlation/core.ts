import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildGovernanceCorrelationObservabilitySurface,
  computeGovernanceCorrelationHash,
  correlateGovernanceLedgers,
  getGovernanceCrossLedgerCorrelationContract,
  validateGovernanceCorrelation,
} from "@/services/governance-cross-ledger-correlation";
import type {
  GovernanceCrossLedgerCorrelationInput,
  GovernanceCrossLedgerCorrelationResponse,
} from "@/types/governance-cross-ledger-correlation";

export async function requireGovernanceCrossLedgerCorrelationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): GovernanceCrossLedgerCorrelationInput {
  return body as GovernanceCrossLedgerCorrelationInput;
}

function responseFromBody(body: Record<string, unknown>): GovernanceCrossLedgerCorrelationResponse {
  return (body.response as GovernanceCrossLedgerCorrelationResponse | undefined) ?? correlateGovernanceLedgers(inputFromBody(body));
}

export function getGovernanceCrossLedgerCorrelationContractResponse() {
  return getGovernanceCrossLedgerCorrelationContract();
}

export async function correlateGovernanceLedgersRequest(request: Request) {
  return correlateGovernanceLedgers(inputFromBody(await readBody(request)));
}

export async function validateGovernanceCorrelationRequest(request: Request) {
  return validateGovernanceCorrelation(inputFromBody(await readBody(request)));
}

export async function graphGovernanceCorrelationRequest(request: Request) {
  return responseFromBody(await readBody(request)).relationship_graph;
}

export async function relationshipsGovernanceCorrelationRequest(request: Request) {
  return responseFromBody(await readBody(request)).correlations;
}

export async function replayGovernanceCorrelationRequest(request: Request) {
  return responseFromBody(await readBody(request)).replay_correlation;
}

export async function hashGovernanceCorrelationRequest(request: Request) {
  const response = responseFromBody(await readBody(request));
  return { correlation_hash: computeGovernanceCorrelationHash(response), response };
}

export async function inspectGovernanceCorrelationRequest(request?: Request) {
  if (!request) return buildGovernanceCorrelationObservabilitySurface();
  return buildGovernanceCorrelationObservabilitySurface(inputFromBody(await readBody(request)));
}
