import { randomUUID } from "node:crypto";
import { prisma } from "@/src/server/db/prisma";
import { decideNuruCurationProposal } from "@/src/server/services/nuru-agent-service";
import { nuruTandemKnowledgeIntakeService } from "@/src/server/services/nuru-tandem-knowledge-intake-service";
import type { TandemKnowledgeCandidate } from "@/src/tandem/nuru-knowledge-contracts";

const workspaceId = "default";
const suffix = randomUUID();
const originalCandidateId = `acceptance-revision-original-${suffix}`;
const revisedCandidateId = `acceptance-revision-revised-${suffix}`;
const missionId = "tandem-governed-revision-acceptance";

function candidate(candidateId: string, revisionOfCandidateId?: string): TandemKnowledgeCandidate {
  return {
    candidateId,
    revisionOfCandidateId,
    missionId,
    originatingSystem: "Tandem acceptance harness",
    subject: `Governed revision acceptance ${suffix}`,
    proposedClaims: [{ text: "This controlled acceptance candidate verifies the governed Tandem revision lineage.", confidence: 0.95 }],
    entities: ["Nuru Tandem acceptance"],
    evidence: [{ referenceId: `acceptance-evidence-${suffix}`, detail: "Controlled local acceptance evidence; it has no operational claim outside this validation." }],
    sources: [{ sourceType: "HUMAN_INPUT", origin: "Nuru Tandem acceptance operator", authority: "OWNER" }],
    eventTime: new Date(),
    observedAt: new Date(),
    significance: "LOW",
    reasonForPreservation: "Validates governed revision feedback, immutable lineage, and explicit canonical admission.",
    provenance: { missionContextPackageIds: [], correlationId: `acceptance-${suffix}` },
  };
}

async function main() {
  try {
    const original = await nuruTandemKnowledgeIntakeService.intake(candidate(originalCandidateId), { workspaceId, actor: "tandem:acceptance-harness" });
    await decideNuruCurationProposal(original.curationProposalId, { action: "REQUEST_CHANGES", reason: "Acceptance run: submit a distinct revised candidate with preserved lineage." }, "nuru:acceptance-governor");
    const revisionRequest = await nuruTandemKnowledgeIntakeService.feedback(workspaceId, originalCandidateId);
    if (!revisionRequest.revisionRequested || !revisionRequest.decisionReason) throw new Error("Revision feedback was not available to Tandem.");

    const revised = await nuruTandemKnowledgeIntakeService.intake(candidate(revisedCandidateId, originalCandidateId), { workspaceId, actor: "tandem:acceptance-harness" });
    await decideNuruCurationProposal(revised.curationProposalId, { action: "APPROVE", reason: "Acceptance run: revised candidate meets the stated request and is explicitly admitted." }, "nuru:acceptance-governor");
    const finalFeedback = await nuruTandemKnowledgeIntakeService.feedback(workspaceId, revisedCandidateId);
    const auditEvents = await prisma.nuruAuditEvent.findMany({ where: { proposalId: { in: [original.curationProposalId, revised.curationProposalId] } }, select: { proposalId: true, eventType: true, decision: true, reason: true }, orderBy: { createdAt: "asc" } });
    const approvedKnowledge = await prisma.nuruKnowledgeItem.findFirst({ where: { id: (await prisma.nuruCurationProposal.findUniqueOrThrow({ where: { id: revised.curationProposalId }, select: { itemId: true } })).itemId }, select: { id: true, status: true } });

    if (finalFeedback.status !== "APPROVED" || !approvedKnowledge || approvedKnowledge.status !== "APPROVED" || !auditEvents.some((event) => event.eventType === "CURATION_REVISION_REQUESTED") || !auditEvents.some((event) => event.eventType === "CURATION_APPROVED")) {
      throw new Error("Acceptance assertions failed for revision lineage, audit history, or canonical admission.");
    }

    console.log(JSON.stringify({ status: "PASS", originalCandidateId, revisedCandidateId, originalProposalId: original.curationProposalId, revisedProposalId: revised.curationProposalId, revisionFeedback: revisionRequest, finalFeedback, approvedKnowledge, auditEvents }));
  } finally {
    await prisma.$disconnect();
  }
}

void main();
