import { getProvingEvidenceAggregationQualificationLedgerBundle, runProvingEvidenceAggregationQualificationLedger, validateProvingEvidenceAggregationQualificationLedger } from "@/services/proving-evidence-aggregation-qualification-ledger";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { EvidenceInput, EvidenceLedgerResult } from "@/types/proving-evidence-aggregation-qualification-ledger";

export async function requireEvidenceLedgerUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): EvidenceInput { return body as EvidenceInput; }
function resultFromBody(body: Record<string, unknown>): EvidenceLedgerResult { return (body.result as EvidenceLedgerResult | undefined) ?? runProvingEvidenceAggregationQualificationLedger(inputFromBody(body)); }
export function contractResponse() { return getProvingEvidenceAggregationQualificationLedgerBundle(); }
export async function validateRequest(request: Request) { return validateProvingEvidenceAggregationQualificationLedger(resultFromBody(await readBody(request))); }
export async function collectionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEvidenceAggregationQualificationLedger(); return { collection: result.collection }; }
export async function validationEngineRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEvidenceAggregationQualificationLedger(); return { validation_engine: result.validation_engine }; }
export async function aggregationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEvidenceAggregationQualificationLedger(); return { aggregated_package: result.aggregated_package }; }
export async function lineageRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEvidenceAggregationQualificationLedger(); return { lineage_graph: result.lineage_graph }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEvidenceAggregationQualificationLedger(); return { ledger: result.ledger }; }
export async function qualificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEvidenceAggregationQualificationLedger(); return { qualification_evidence: result.qualification_evidence }; }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEvidenceAggregationQualificationLedger(); return { registry: result.registry }; }
export async function replayReferencesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEvidenceAggregationQualificationLedger(); return { replay_references: result.replay_references }; }
export async function federationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEvidenceAggregationQualificationLedger(); return { federated_graph: result.federated_graph }; }
export async function auditRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEvidenceAggregationQualificationLedger(); return { audit_report: result.audit_report }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEvidenceAggregationQualificationLedger(); return { governance_policy: result.governance_policy }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProvingEvidenceAggregationQualificationLedger(); return { gates: result.gates, decision: result.decision, readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
