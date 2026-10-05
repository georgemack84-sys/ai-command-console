import { createHash } from "node:crypto";
import type { ExtractedSection } from "@/src/nuru/document-extraction";

export const claimTypes = ["FACTUAL", "QUANTITATIVE", "NORMATIVE", "ASSERTION"] as const;
export type ClaimType = (typeof claimTypes)[number];
export type ClaimCandidate = { claimText: string; claimType: ClaimType; confidence: number; passageReference: string; passageText: string; fingerprint: string };

function classify(text: string): ClaimType {
  if (/\b\d+(?:\.\d+)?(?:%|\b)/.test(text)) return "QUANTITATIVE";
  if (/\b(must|should|ought|recommended|require[sd]?)\b/i.test(text)) return "NORMATIVE";
  if (/\b(is|are|was|were|has|have|will)\b/i.test(text)) return "FACTUAL";
  return "ASSERTION";
}

/** Candidate extraction is deterministic and intentionally conservative; it never evaluates truth. */
export function extractClaimCandidates(rawArtifactId: string, sections: ExtractedSection[]) {
  const candidates: ClaimCandidate[] = [];
  for (const section of sections) {
    for (const sentence of section.content.split(/(?<=[.!?])\s+/).map((value) => value.trim()).filter((value) => value.length >= 24)) {
      const fingerprint = createHash("sha256").update(`${rawArtifactId}:${section.ordinal}:${sentence}`).digest("hex");
      candidates.push({ claimText: sentence, claimType: classify(sentence), confidence: 0.35, passageReference: `${rawArtifactId}#section-${section.ordinal + 1}`, passageText: section.content, fingerprint });
      if (candidates.length === 30) return candidates;
    }
  }
  return candidates;
}
