export function validateReplayDeterminism({
  bundle,
}: {
  bundle: any;
}) {
  const evidence: string[] = [];
  if (bundle.state === "disputed" || bundle.timeline?.meta?.matchesReadModel === false) {
    evidence.push("timeline:disputed");
  }
  const valid = evidence.length === 0;
  return {
    valid,
    evidence,
  };
}
