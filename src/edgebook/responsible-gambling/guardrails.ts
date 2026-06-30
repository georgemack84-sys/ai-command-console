import { EDGEBOOK_RESPONSIBLE_GAMBLING_DISCLAIMER } from "./disclaimer";

export const prohibitedBettingClaims = [
  "lock",
  "sure bet",
  "risk-free",
  "guaranteed win",
  "guarantee profit",
  "chasing losses",
] as const;

export function evaluateResponsibleGamblingText(text: string): {
  status: "VALID" | "REJECTED";
  disclaimer: string;
  violations: string[];
} {
  const normalized = text.toLowerCase();
  const violations = prohibitedBettingClaims.filter((claim) => normalized.includes(claim));

  return {
    status: violations.length > 0 ? "REJECTED" : "VALID",
    disclaimer: EDGEBOOK_RESPONSIBLE_GAMBLING_DISCLAIMER,
    violations,
  };
}
