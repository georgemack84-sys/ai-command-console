import { NuruVaultPersistenceAdapter } from "@/src/server/repositories/nuru-vault-persistence-adapter";
import { NuruSourceRegistryService } from "@/src/server/services/nuru-source-registry-service";
import { NuruVaultCanonicalPromotionService } from "@/src/server/services/nuru-vault-canonical-promotion-service";
import { NuruVaultCanonicalProjectionService } from "@/src/server/services/nuru-vault-canonical-projection-service";
import { NuruVaultSourceIntakeService } from "@/src/server/services/nuru-vault-source-intake-service";

const workspaceId = process.env.NURU_VAULT_SMOKE_WORKSPACE_ID;
const sourceRegistryId = process.env.NURU_VAULT_SMOKE_SOURCE_REGISTRY_ID;

async function run() {
  if (!workspaceId || !sourceRegistryId) {
    throw new Error("Set NURU_VAULT_SMOKE_WORKSPACE_ID and NURU_VAULT_SMOKE_SOURCE_REGISTRY_ID before running this write-capable development smoke test.");
  }
  const vault = new NuruVaultPersistenceAdapter(workspaceId);
  const correlationId = crypto.randomUUID();
  const intake = await NuruVaultSourceIntakeService.intake({
    sourceRegistryId,
    acquisitionMethod: "MANUAL",
    sourceContent: "This controlled fixture describes why evidence, candidate interpretation, and canonical approval are separate stages.",
    sourceClassification: "PUBLIC",
    evidence: { locator: "fixture://nuru-vault-smoke#separation", content: "Evidence, candidate interpretation, and canonical approval are separate stages." },
    candidate: { interpretation: "A concise discovery explaining Nuru Vault’s authority boundary.", confidence: 0.92 },
  }, { workspaceId, actor: "human:dev-smoke", correlationId }, NuruSourceRegistryService, vault);
  const decision = {
    schemaVersion: intake.candidate.schemaVersion,
    id: `decision:${crypto.randomUUID()}`,
    kind: "GOVERNANCE_DECISION" as const,
    classification: intake.candidate.classification,
    createdAt: new Date().toISOString(),
    correlationId,
    candidateId: intake.candidate.id,
    outcome: "APPROVED" as const,
    decidedBy: "human:dev-smoke",
    decidedAt: new Date().toISOString(),
    rationale: "Controlled development smoke test with approved fixture evidence.",
    requiredHumanReview: true,
    humanApprovalId: `approval:${crypto.randomUUID()}`,
  };
  const promotion = await NuruVaultCanonicalPromotionService.promote({ candidate: intake.candidate, decision, canonicalRecordId: `canonical:${crypto.randomUUID()}` }, vault);
  const projection = await NuruVaultCanonicalProjectionService.rebuild(vault);
  const discoveries = await NuruVaultCanonicalProjectionService.listDiscoveryView(vault, projection);
  console.log(JSON.stringify({ sourceId: intake.source.id, evidenceId: intake.evidence.id, candidateId: intake.candidate.id, canonicalRecordId: promotion.record.id, revision: projection.revision, discoveryCount: discoveries.length, discovery: discoveries.at(-1) }, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
