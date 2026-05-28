import type { RegistrySnapshot } from "@/services/registry-snapshots";
import { REGISTRY_TRUST_ERROR_CODES } from "@/services/registry-signatures";
import { validateRegistryPromotion } from "./registryPromotionValidator";
import type {
  RegistryProvenanceVerificationFailure,
  RegistryProvenanceVerificationResult,
  RegistrySnapshotProvenance,
} from "./registryProvenanceTypes";

function failure(
  code: RegistryProvenanceVerificationFailure["code"],
  message: string,
  path?: string,
  expected?: unknown,
  actual?: unknown,
): RegistryProvenanceVerificationFailure {
  return { code, message, path, expected, actual };
}

export function verifyRegistryProvenance(
  snapshot: RegistrySnapshot,
  provenance?: RegistrySnapshotProvenance | null,
  parentSnapshot?: RegistrySnapshot | null,
): RegistryProvenanceVerificationResult {
  if (!provenance) {
    return {
      ok: false,
      failures: [
        failure(
          REGISTRY_TRUST_ERROR_CODES.REGISTRY_PROVENANCE_MISSING,
          "registry snapshot provenance is required",
          "provenance",
        ),
      ],
    };
  }

  const failures: RegistryProvenanceVerificationFailure[] = [];

  if (provenance.snapshotId !== snapshot.manifest.snapshotId) {
    failures.push(
      failure(
        REGISTRY_TRUST_ERROR_CODES.REGISTRY_PROVENANCE_INVALID,
        "registry snapshot provenance references a different snapshot id",
        "provenance.snapshotId",
        snapshot.manifest.snapshotId,
        provenance.snapshotId,
      ),
    );
  }

  if (provenance.registrySnapshotHash !== snapshot.manifest.registrySnapshotHash) {
    failures.push(
      failure(
        REGISTRY_TRUST_ERROR_CODES.REGISTRY_PROVENANCE_HASH_MISMATCH,
        "registry snapshot provenance references a different snapshot hash",
        "provenance.registrySnapshotHash",
        snapshot.manifest.registrySnapshotHash,
        provenance.registrySnapshotHash,
      ),
    );
  }

  if (snapshot.manifest.parentSnapshotHash) {
    if (!provenance.parentSnapshotId || !provenance.parentSnapshotHash) {
      failures.push(
        failure(
          REGISTRY_TRUST_ERROR_CODES.REGISTRY_PROVENANCE_INVALID,
          "registry snapshot provenance parent reference is incomplete",
          "provenance.parentSnapshotHash",
        ),
      );
    } else if (!parentSnapshot) {
      failures.push(
        failure(
          REGISTRY_TRUST_ERROR_CODES.REGISTRY_PROVENANCE_INVALID,
          "registry snapshot provenance parent snapshot is missing",
          "provenance.parentSnapshotHash",
        ),
      );
    } else {
      if (provenance.parentSnapshotId !== parentSnapshot.manifest.snapshotId) {
        failures.push(
          failure(
            REGISTRY_TRUST_ERROR_CODES.REGISTRY_PROVENANCE_INVALID,
            "registry snapshot provenance parent id does not match the frozen parent snapshot",
            "provenance.parentSnapshotId",
            parentSnapshot.manifest.snapshotId,
            provenance.parentSnapshotId,
          ),
        );
      }
      if (provenance.parentSnapshotHash !== parentSnapshot.manifest.registrySnapshotHash) {
        failures.push(
          failure(
            REGISTRY_TRUST_ERROR_CODES.REGISTRY_PROVENANCE_HASH_MISMATCH,
            "registry snapshot provenance parent hash does not match the frozen parent snapshot",
            "provenance.parentSnapshotHash",
            parentSnapshot.manifest.registrySnapshotHash,
            provenance.parentSnapshotHash,
          ),
        );
      }
    }
  }

  const requiresApprovalChain =
    provenance.promotionStage === "production" ||
    provenance.explicitPromotionApproval === true;
  if (requiresApprovalChain && !provenance.approvalChainHash) {
    failures.push(
      failure(
        REGISTRY_TRUST_ERROR_CODES.REGISTRY_APPROVAL_CHAIN_MISSING,
        "registry snapshot provenance is missing the required approval chain hash",
        "provenance.approvalChainHash",
      ),
    );
  }

  if (requiresApprovalChain && !provenance.approvedBy) {
    failures.push(
      failure(
        REGISTRY_TRUST_ERROR_CODES.REGISTRY_PROVENANCE_INVALID,
        "registry snapshot provenance is missing the approving governance identity",
        "provenance.approvedBy",
      ),
    );
  }

  if (snapshot.content.tools.some((tool) => tool.governanceMetadata) && !provenance.governanceSnapshotHash) {
    failures.push(
      failure(
        REGISTRY_TRUST_ERROR_CODES.REGISTRY_GOVERNANCE_SNAPSHOT_MISSING,
        "registry snapshot provenance is missing the governance snapshot hash",
        "provenance.governanceSnapshotHash",
      ),
    );
  }

  const promotion = validateRegistryPromotion(provenance);
  failures.push(...promotion.failures);

  return { ok: failures.length === 0, failures };
}

