import { createHash } from "node:crypto";
import { canonicalizeNuruAuditPayload } from "@/src/tandem/nuru-audit-integrity";
import { signConfiguredNuruAuditPayload } from "@/src/server/services/nuru-audit-signing-service";
import { tandemKnowledgeCandidateFeedbackSchema, tandemKnowledgeCandidateReceiptSchema, tandemKnowledgeCandidateSchema, type TandemKnowledgeCandidate, type TandemKnowledgeCandidateFeedback, type TandemKnowledgeCandidateReceipt } from "@/src/tandem/nuru-knowledge-contracts";
import { createNuruCurationProposal } from "@/src/server/services/nuru-agent-service";
import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";

type ReceiptRow = { id: string; workspaceId: string; candidateId: string; missionId: string; curationProposalId: string; receivedAt: Date; payload?: TandemKnowledgeCandidate };
type CurationResult = { proposal: { id: string } };
export const tandemRevisionStaleBefore = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

export { canonicalizeNuruAuditPayload } from "@/src/tandem/nuru-audit-integrity";

export function sha256NuruAuditPayload(payload: unknown) {
  return createHash("sha256").update(canonicalizeNuruAuditPayload(payload), "utf8").digest("hex");
}

/** A revision request remains historical after resubmission; it is stale only until that lineage advances. */
export function countStaleTandemRevisionRequests(requestProposalIds: string[], receipts: Array<{ candidateId: string; curationProposalId: string; payload?: { revisionOfCandidateId?: string } }>) {
  const candidateByProposalId = new Map(receipts.map((receipt) => [receipt.curationProposalId, receipt.candidateId]));
  const resubmittedCandidateIds = new Set(receipts.flatMap((receipt) => receipt.payload?.revisionOfCandidateId ? [receipt.payload.revisionOfCandidateId] : []));
  return requestProposalIds.filter((proposalId) => {
    const candidateId = candidateByProposalId.get(proposalId);
    return candidateId !== undefined && !resubmittedCandidateIds.has(candidateId);
  }).length;
}
export type NuruTandemKnowledgeIntakeStore = {
  findReceipt(workspaceId: string, candidateId: string): Promise<ReceiptRow | null>;
  createReceipt(input: ReceiptRow & { payload: TandemKnowledgeCandidate }): Promise<ReceiptRow>;
  createCuration(input: Parameters<typeof createNuruCurationProposal>[0], actor: string): Promise<CurationResult>;
  findRevisionParent?(workspaceId: string, candidateId: string): Promise<{ missionId: string; status: string } | null>;
};

const defaultStore: NuruTandemKnowledgeIntakeStore = {
  async findReceipt(workspaceId, candidateId) {
    const receipts = nuruKnowledgeRepository.tandemKnowledgeCandidateReceipt as unknown as { findUnique(args: unknown): Promise<ReceiptRow | null> };
    return receipts.findUnique({ where: { workspaceId_candidateId: { workspaceId, candidateId } } });
  },
  async createReceipt(input) {
    const receipts = nuruKnowledgeRepository.tandemKnowledgeCandidateReceipt as unknown as { create(args: unknown): Promise<ReceiptRow> };
    return receipts.create({ data: input });
  },
  createCuration: createNuruCurationProposal,
  async findRevisionParent(workspaceId, candidateId) {
    const receipts = nuruKnowledgeRepository.tandemKnowledgeCandidateReceipt as unknown as { findUnique(args: unknown): Promise<ReceiptRow | null> };
    const proposals = nuruKnowledgeRepository.nuruCurationProposal as unknown as { findUnique(args: unknown): Promise<{ status: string } | null> };
    const receipt = await receipts.findUnique({ where: { workspaceId_candidateId: { workspaceId, candidateId } } });
    if (!receipt) return null;
    const proposal = await proposals.findUnique({ where: { id: receipt.curationProposalId } });
    return proposal ? { missionId: receipt.missionId, status: proposal.status } : null;
  },
};

function candidateContent(candidate: TandemKnowledgeCandidate) {
  return [
    `Tandem mission candidate: ${candidate.missionId}`, `Subject: ${candidate.subject}`, "", "Proposed claims:",
    ...candidate.proposedClaims.map((claim) => `- ${claim.text} (reported confidence ${claim.confidence})`), ...(candidate.revisionOfCandidateId ? [`Revision of Tandem candidate: ${candidate.revisionOfCandidateId}`] : []), "", "Evidence:",
    ...candidate.evidence.map((evidence) => `- ${evidence.referenceId}: ${evidence.detail}`), "", `Preservation rationale: ${candidate.reasonForPreservation}`,
  ].join("\n");
}

/** Nuru intake boundary: creates a review-required curation proposal, never canonical knowledge. */
export class NuruTandemKnowledgeIntakeService {
  constructor(private readonly store: NuruTandemKnowledgeIntakeStore = defaultStore) {}

  async intake(rawCandidate: TandemKnowledgeCandidate, context: { workspaceId: string; actor: string }): Promise<TandemKnowledgeCandidateReceipt> {
    const candidate = tandemKnowledgeCandidateSchema.parse(rawCandidate);
    if (candidate.revisionOfCandidateId && this.store.findRevisionParent) {
      const parent = await this.store.findRevisionParent(context.workspaceId, candidate.revisionOfCandidateId);
      if (!parent || parent.missionId !== candidate.missionId || parent.status !== "REQUEST_CHANGES") throw new Error("A revision must reference a same-mission candidate with a recorded revision request.");
    }
    const existing = await this.store.findReceipt(context.workspaceId, candidate.candidateId);
    if (existing) return tandemKnowledgeCandidateReceiptSchema.parse({ receiptId: existing.id, workspaceId: existing.workspaceId, candidateId: existing.candidateId, revisionOfCandidateId: existing.payload?.revisionOfCandidateId, missionId: existing.missionId, curationProposalId: existing.curationProposalId, receivedAt: existing.receivedAt.toISOString(), status: "QUEUED_FOR_HUMAN_REVIEW", canonicalKnowledgeEffect: "NONE" });
    const curation = await this.store.createCuration({
      title: `${candidate.subject}: Tandem mission candidate`, content: candidateContent(candidate), project: "Tandem",
      source: candidate.sources[0], submission: { humanReason: candidate.reasonForPreservation, proposedTopics: candidate.entities, journeyContext: `Tandem mission ${candidate.missionId}` },
    }, context.actor);
    const receipt = await this.store.createReceipt({ id: `TANDEM-NURU-RECEIPT-${crypto.randomUUID()}`, workspaceId: context.workspaceId, candidateId: candidate.candidateId, missionId: candidate.missionId, curationProposalId: curation.proposal.id, receivedAt: new Date(), payload: candidate });
    return tandemKnowledgeCandidateReceiptSchema.parse({ receiptId: receipt.id, workspaceId: receipt.workspaceId, candidateId: receipt.candidateId, revisionOfCandidateId: candidate.revisionOfCandidateId, missionId: receipt.missionId, curationProposalId: receipt.curationProposalId, receivedAt: receipt.receivedAt.toISOString(), status: "QUEUED_FOR_HUMAN_REVIEW", canonicalKnowledgeEffect: "NONE" });
  }

  async feedback(workspaceId: string, candidateId: string): Promise<TandemKnowledgeCandidateFeedback> {
    const repository = nuruKnowledgeRepository as unknown as { tandemKnowledgeCandidateReceipt: { findUnique(args: unknown): Promise<ReceiptRow | null> }; nuruCurationProposal: { findUnique(args: unknown): Promise<{ id: string; status: string; decisionReason: string | null } | null> } };
    const receipt = await repository.tandemKnowledgeCandidateReceipt.findUnique({ where: { workspaceId_candidateId: { workspaceId, candidateId } } });
    if (!receipt) throw new Error("Tandem candidate receipt was not found.");
    const proposal = await repository.nuruCurationProposal.findUnique({ where: { id: receipt.curationProposalId } });
    if (!proposal) throw new Error("The linked Nuru curation proposal was not found.");
    return tandemKnowledgeCandidateFeedbackSchema.parse({ candidateId: receipt.candidateId, missionId: receipt.missionId, curationProposalId: proposal.id, status: proposal.status, decisionReason: proposal.decisionReason, revisionRequested: proposal.status === "REQUEST_CHANGES", canonicalKnowledgeEffect: "NONE" });
  }

  /** Read-only, workspace-scoped evidence bundle for a candidate's immutable review lineage. */
  async auditExport(workspaceId: string, candidateId: string) {
    type AuditReceipt = ReceiptRow & { payload: TandemKnowledgeCandidate };
    type AuditProposal = { id: string; status: string; recommendation: string; decisionReason: string | null; reviewedBy: string | null; reviewedAt: Date | null };
    type AuditEvent = { id: string; eventType: string; actor: string; decision: string | null; reason: string | null; correlationId: string; createdAt: Date };
    const repository = nuruKnowledgeRepository as unknown as {
      tandemKnowledgeCandidateReceipt: { findMany(args: unknown): Promise<AuditReceipt[]> };
      nuruCurationProposal: { findMany(args: unknown): Promise<AuditProposal[]> };
      nuruAuditEvent: { findMany(args: unknown): Promise<AuditEvent[]> };
    };
    const receipts = await repository.tandemKnowledgeCandidateReceipt.findMany({ where: { workspaceId }, orderBy: { receivedAt: "asc" } });
    const requested = receipts.find((receipt) => receipt.candidateId === candidateId);
    if (!requested) throw new Error("Tandem candidate receipt was not found.");
    const byCandidateId = new Map(receipts.map((receipt) => [receipt.candidateId, receipt]));
    const rootFor = (receipt: AuditReceipt) => {
      const visited = new Set<string>();
      let current = receipt;
      while (current.payload.revisionOfCandidateId && !visited.has(current.candidateId)) {
        visited.add(current.candidateId);
        const parent = byCandidateId.get(current.payload.revisionOfCandidateId);
        if (!parent) break;
        current = parent;
      }
      return current.candidateId;
    };
    const rootCandidateId = rootFor(requested);
    const lineage = receipts.filter((receipt) => rootFor(receipt) === rootCandidateId);
    const proposalIds = lineage.map((receipt) => receipt.curationProposalId);
    const [proposals, events] = await Promise.all([
      repository.nuruCurationProposal.findMany({ where: { id: { in: proposalIds } }, select: { id: true, status: true, recommendation: true, decisionReason: true, reviewedBy: true, reviewedAt: true } }),
      repository.nuruAuditEvent.findMany({ where: { proposalId: { in: proposalIds } }, select: { id: true, eventType: true, actor: true, decision: true, reason: true, correlationId: true, createdAt: true }, orderBy: { createdAt: "asc" } }),
    ]);
    const proposalsById = new Map(proposals.map((proposal) => [proposal.id, proposal]));
    const exportPayload = {
      exportVersion: "NURU_TANDEM_CANDIDATE_AUDIT_V1",
      readOnly: true,
      generatedAt: new Date().toISOString(),
      workspaceId,
      rootCandidateId,
      lifecycle: lineage.map((receipt) => {
        const proposal = proposalsById.get(receipt.curationProposalId);
        return {
          receiptId: receipt.id,
          candidateId: receipt.candidateId,
          revisionOfCandidateId: receipt.payload.revisionOfCandidateId ?? null,
          missionId: receipt.missionId,
          receivedAt: receipt.receivedAt.toISOString(),
          proposal: proposal ? { ...proposal, reviewedAt: proposal.reviewedAt?.toISOString() ?? null } : null,
          canonicalKnowledgeEffect: "NONE" as const,
        };
      }),
      auditEvents: events.map((event) => ({ ...event, createdAt: event.createdAt.toISOString() })),
    };
    const canonicalPayload = canonicalizeNuruAuditPayload(exportPayload);
    const signature = await signConfiguredNuruAuditPayload(canonicalPayload);
    return { ...exportPayload, integrity: { algorithm: "SHA-256", digest: sha256NuruAuditPayload(exportPayload), canonicalization: "JSON object keys sorted lexically; arrays retain recorded order; UTF-8 encoded." }, signature: signature ?? { status: "UNSIGNED_LOCAL_CONFIGURATION" as const, reason: "Configure Cloud KMS or managed signing-key injection to sign audit exports." } };
  }

  async list(workspaceId: string) {
    const repository = nuruKnowledgeRepository as unknown as { tandemKnowledgeCandidateReceipt: { findMany(args: unknown): Promise<Array<{ id: string; candidateId: string; missionId: string; curationProposalId: string; receivedAt: Date; payload: TandemKnowledgeCandidate }>> }; nuruCurationProposal: { findMany(args: unknown): Promise<Array<{ id: string; status: string; recommendation: string; requiredReview: boolean }>> } };
    const receipts = await repository.tandemKnowledgeCandidateReceipt.findMany({ where: { workspaceId }, orderBy: { receivedAt: "desc" }, take: 100 });
    const proposals = receipts.length ? await repository.nuruCurationProposal.findMany({ where: { id: { in: receipts.map((receipt) => receipt.curationProposalId) } }, select: { id: true, status: true, recommendation: true, requiredReview: true } }) : [];
    const byId = new Map(proposals.map((proposal) => [proposal.id, proposal]));
    const receiptByCandidateId = new Map(receipts.map((receipt) => [receipt.candidateId, receipt]));
    const rootCandidateId = (receipt: typeof receipts[number]) => {
      const visited = new Set<string>();
      let current = receipt;
      while (current.payload.revisionOfCandidateId && !visited.has(current.candidateId)) {
        visited.add(current.candidateId);
        const parent = receiptByCandidateId.get(current.payload.revisionOfCandidateId);
        if (!parent) break;
        current = parent;
      }
      return current.candidateId;
    };
    const lifecycleByRoot = new Map<string, typeof receipts>();
    for (const receipt of receipts) {
      const root = rootCandidateId(receipt);
      lifecycleByRoot.set(root, [...(lifecycleByRoot.get(root) ?? []), receipt]);
    }
    return receipts.map((receipt) => {
      const root = rootCandidateId(receipt);
      const lifecycle = (lifecycleByRoot.get(root) ?? [receipt]).sort((left, right) => left.receivedAt.getTime() - right.receivedAt.getTime()).map((entry) => ({ candidateId: entry.candidateId, receivedAt: entry.receivedAt, status: byId.get(entry.curationProposalId)?.status ?? "PROPOSAL_UNAVAILABLE", revisionOfCandidateId: entry.payload.revisionOfCandidateId }));
      return { receipt, proposal: byId.get(receipt.curationProposalId) ?? null, lifecycle, canonicalKnowledgeEffect: "NONE" as const };
    });
  }
}

export const nuruTandemKnowledgeIntakeService = new NuruTandemKnowledgeIntakeService();
