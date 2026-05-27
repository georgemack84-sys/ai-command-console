import type { AuthorityBoundary, ConstitutionalGovernanceInput } from "@/types/constitutional-governance";
import { hashConstitutionalGovernanceValue } from "@/services/constitutional-governance-layer/constitutionalGovernanceHasher";

export function buildAuthorityBoundaryRegistry(input: ConstitutionalGovernanceInput): readonly AuthorityBoundary[] {
  const approvalRequired = Object.freeze([input.treaty.manifest.approvalChainHash]);
  return Object.freeze([
    Object.freeze({
      authorityId: "authority:replay",
      authorityClass: "replay",
      sourceAuthority: "4.4E.replay-reconstruction-engine",
      allowedScopes: Object.freeze(["inspect", "compare", "export-evidence"]),
      deniedOperations: Object.freeze(["mutate", "execute", "escalate"]),
      requiresApproval: false,
      immutable: true,
      lineageHash: hashConstitutionalGovernanceValue("authority-boundary", {
        authorityClass: "replay",
        replayLineageHash: input.treaty.evidence.replayLineageHash,
      }),
    }),
    Object.freeze({
      authorityId: "authority:snapshot",
      authorityClass: "snapshot",
      sourceAuthority: "4.4F.deterministic-snapshot-engine",
      allowedScopes: Object.freeze(["inspect", "lineage-read", "hash-verify"]),
      deniedOperations: Object.freeze(["mutate", "replace", "inject-drift"]),
      requiresApproval: false,
      immutable: true,
      lineageHash: hashConstitutionalGovernanceValue("authority-boundary", {
        authorityClass: "snapshot",
        snapshotIds: input.snapshots.map((snapshot) => snapshot.snapshotId),
      }),
    }),
    Object.freeze({
      authorityId: "authority:simulation",
      authorityClass: "simulation",
      sourceAuthority: "control-plane.simulation",
      allowedScopes: Object.freeze(["inspect", "compare", "branch-visibility"]),
      deniedOperations: Object.freeze(["execute", "orchestrate", "mutate-runtime", "mutate-policy"]),
      requiresApproval: false,
      immutable: true,
      lineageHash: hashConstitutionalGovernanceValue("authority-boundary", {
        authorityClass: "simulation",
        replayHash: input.replay.reconstructionHash,
      }),
    }),
    Object.freeze({
      authorityId: "authority:recovery",
      authorityClass: "recovery",
      sourceAuthority: "console.operator-recovery",
      allowedScopes: Object.freeze(["visibility", "request-review"]),
      deniedOperations: Object.freeze(["auto-recover", "self-heal", "apply-rollback"]),
      requiresApproval: true,
      immutable: true,
      lineageHash: hashConstitutionalGovernanceValue("authority-boundary", {
        authorityClass: "recovery",
        approvalRequired,
      }),
    }),
    Object.freeze({
      authorityId: "authority:escalation",
      authorityClass: "escalation",
      sourceAuthority: "control-plane.review",
      allowedScopes: Object.freeze(["request-review", "pause-visibility", "override-eligibility-read"]),
      deniedOperations: Object.freeze(["self-issue-override", "autonomous-escalation"]),
      requiresApproval: true,
      immutable: true,
      lineageHash: hashConstitutionalGovernanceValue("authority-boundary", {
        authorityClass: "escalation",
        routes: input.consoleView.approvals.data.escalationRoutes,
      }),
    }),
    Object.freeze({
      authorityId: "authority:autonomy",
      authorityClass: "autonomy",
      sourceAuthority: "4.4F.deterministic-snapshot-engine",
      allowedScopes: Object.freeze(["visibility", "boundary-inspection"]),
      deniedOperations: Object.freeze(["self-authorize", "escalate-authority", "execute"]),
      requiresApproval: true,
      immutable: true,
      lineageHash: hashConstitutionalGovernanceValue("authority-boundary", {
        authorityClass: "autonomy",
        autonomyLevel: input.consoleView.autonomy.autonomyLevel,
      }),
    }),
    Object.freeze({
      authorityId: "authority:forensics",
      authorityClass: "forensics",
      sourceAuthority: "4.4A.validation-core",
      allowedScopes: Object.freeze(["inspect", "timeline-read", "evidence-read"]),
      deniedOperations: Object.freeze(["rewrite-history", "fabricate-events"]),
      requiresApproval: false,
      immutable: true,
      lineageHash: hashConstitutionalGovernanceValue("authority-boundary", {
        authorityClass: "forensics",
        resultHash: input.validation.result.resultHash,
      }),
    }),
    Object.freeze({
      authorityId: "authority:branch",
      authorityClass: "branch",
      sourceAuthority: "4.4F.deterministic-snapshot-engine",
      allowedScopes: Object.freeze(["lineage-read", "branch-compare"]),
      deniedOperations: Object.freeze(["collapse-branch", "rewrite-lineage"]),
      requiresApproval: false,
      immutable: true,
      lineageHash: hashConstitutionalGovernanceValue("authority-boundary", {
        authorityClass: "branch",
        branchIds: input.snapshots.map((snapshot) => snapshot.branchId ?? "root"),
      }),
    }),
  ]);
}
