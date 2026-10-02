import { createPublicKey, randomUUID, verify } from "node:crypto";
import { prisma } from "@/src/server/db/prisma";
import { canonicalizeNuruAuditPayload } from "@/src/tandem/nuru-audit-integrity";
import { nuruTandemKnowledgeIntakeService } from "@/src/server/services/nuru-tandem-knowledge-intake-service";
import type { TandemKnowledgeCandidate } from "@/src/tandem/nuru-knowledge-contracts";

let candidateId = `kms-smoke-${randomUUID()}`;
const workspaceId = "default";

function smokeCandidate(): TandemKnowledgeCandidate {
  return {
    candidateId,
    missionId: "nuru-kms-smoke-test",
    originatingSystem: "Nuru KMS smoke harness",
    subject: "Nuru Cloud KMS audit-signing smoke test",
    proposedClaims: [{ text: "This non-canonical candidate exists only to validate signed audit exports.", confidence: 1 }],
    entities: ["Nuru", "Cloud KMS"],
    evidence: [{ referenceId: candidateId, detail: "Controlled local validation evidence; no operational claim or canonical admission." }],
    sources: [{ sourceType: "HUMAN_INPUT", origin: "Nuru KMS smoke harness", authority: "OWNER" }],
    eventTime: new Date(),
    observedAt: new Date(),
    significance: "LOW",
    reasonForPreservation: "Validates Google Cloud KMS-backed audit signing without approving canonical knowledge.",
    provenance: { missionContextPackageIds: [], correlationId: candidateId },
  };
}

async function main() {
  try {
    const existing = await prisma.tandemKnowledgeCandidateReceipt.findFirst({
      where: { workspaceId, candidateId: { startsWith: "kms-smoke-" } },
      orderBy: { receivedAt: "desc" },
    });
    candidateId = existing?.candidateId ?? candidateId;
    console.log(existing ? "Reusing queued non-canonical Tandem candidate receipt..." : "Creating non-canonical Tandem candidate receipt...");
    const receipt = existing ?? await nuruTandemKnowledgeIntakeService.intake(smokeCandidate(), {
      workspaceId,
      actor: "nuru:kms-smoke-harness",
    });
    console.log("Creating KMS-signed audit export...");
    const audit = await nuruTandemKnowledgeIntakeService.auditExport(workspaceId, candidateId);
    if (!("valueBase64" in audit.signature)) throw new Error("Audit export was not signed by the configured Cloud KMS key.");

    const { integrity: _integrity, signature, ...signedPayload } = audit;
    const publicKey = createPublicKey({ key: Buffer.from(signature.publicKeySpkiBase64, "base64"), format: "der", type: "spki" });
    const signatureValid = verify(null, Buffer.from(canonicalizeNuruAuditPayload(signedPayload), "utf8"), publicKey, Buffer.from(signature.valueBase64, "base64"));
    if (!signatureValid) throw new Error("Cloud KMS produced a signature that did not verify against the exported public key.");

    console.log(JSON.stringify({
      status: "PASS",
      candidateId,
      curationProposalId: receipt.curationProposalId,
      proposalStatus: "QUEUED_FOR_HUMAN_REVIEW",
      canonicalKnowledgeEffect: "NONE",
      signatureAlgorithm: signature.algorithm,
      keyId: signature.keyId,
      integrityDigest: audit.integrity.digest,
      signatureValid,
    }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

void main();
