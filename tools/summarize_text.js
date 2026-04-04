async function summarizeText(text) {
  if (!text) {
    return "No text provided.";
  }

  const trimmed = String(text).trim();

  if (trimmed.length <= 200) {
    return `Summary: ${trimmed}`;
  }

  const firstSentence = trimmed.split(/[.!?]/)[0];

  if (firstSentence && firstSentence.length > 20) {
    return `Summary: ${firstSentence}.`;
  }

  return `Summary: ${trimmed.slice(0, 200)}...`;
}

module.exports = summarizeText;