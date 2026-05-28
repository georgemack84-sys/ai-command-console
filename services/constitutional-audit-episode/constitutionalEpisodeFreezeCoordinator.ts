export function freezeConstitutionalEpisodeState(
  state: "verified" | "frozen" | "blocked" | "disputed",
): "verified" | "frozen" | "blocked" | "disputed" {
  if (state === "blocked" || state === "frozen" || state === "disputed") {
    return state;
  }
  return state;
}
