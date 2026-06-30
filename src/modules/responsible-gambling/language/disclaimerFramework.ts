export const REQUIRED_RESPONSIBLE_GAMBLING_DISCLAIMER =
  "This is informational market observation only. It is not betting advice, a prediction, or a recommendation.";

export const SHORT_RESPONSIBLE_GAMBLING_DISCLAIMER =
  "Informational only. No betting recommendation generated.";

export function applyResponsibleGamblingDisclaimer(
  output: string,
  level: "required" | "short" = "required",
): string {
  const disclaimer = level === "short" ? SHORT_RESPONSIBLE_GAMBLING_DISCLAIMER : REQUIRED_RESPONSIBLE_GAMBLING_DISCLAIMER;
  return `${output}\n\n${disclaimer}`;
}
