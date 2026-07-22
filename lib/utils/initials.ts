export function sourceInitials(name: string) {
  const cleaned = name.replace(/[^a-zA-Z0-9\s]/g, " ").trim();
  if (!cleaned) return "HF";
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words
    .slice(0, 3)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}
