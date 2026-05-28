import type { RecommendationSynthesisInput } from "./types/recommendationSynthesisTypes";

export function normalizeRecommendationEvidence(input: RecommendationSynthesisInput): readonly string[] {
  const evidence = new Set<string>([
    ...input.evidenceBundleRefs,
    input.decisionReadinessCertificationResult.evidence.evidenceId,
    input.deterministicReplayResult.evidenceBundle.bundleId,
    input.decisionAuditEpisodeResult.exportRecord.exportId,
    input.proposalIntegrityResult.evidence.evidenceId,
  ]);
  return Object.freeze([...evidence].sort((left, right) => left.localeCompare(right)));
}
