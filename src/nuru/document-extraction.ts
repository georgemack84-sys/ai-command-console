import { createHash } from "node:crypto";

export const extractionStatuses = ["EXTRACTED", "EXTRACTION_PENDING"] as const;
export type ExtractionStatus = (typeof extractionStatuses)[number];
export type ExtractedSection = { heading: string; content: string; ordinal: number };
export type ExtractionResult = { status: ExtractionStatus; title: string | null; content: string | null; sections: ExtractedSection[]; language: string | null; extractionMethod: string; contentHash: string | null };

const supportedTextTypes = new Set(["text/plain", "text/markdown", "text/html"]);
const collapse = (value: string) => value.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
const decodeEntities = (value: string) => value.replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, "\"").replace(/&#39;/gi, "'");

function textSections(content: string) {
  const sections = content.split(/\n{2,}/).map((part) => collapse(part)).filter(Boolean);
  return sections.map((content, ordinal) => ({ heading: ordinal === 0 ? "Document" : `Section ${ordinal + 1}`, content, ordinal }));
}

function markdownSections(content: string) {
  const lines = content.split("\n"); const sections: ExtractedSection[] = []; let heading = "Document"; let body: string[] = [];
  const commit = () => { const value = collapse(body.join("\n")); if (value) sections.push({ heading, content: value, ordinal: sections.length }); };
  for (const line of lines) { const match = line.match(/^#{1,6}\s+(.+)$/); if (match) { commit(); heading = match[1].trim(); body = []; } else body.push(line); }
  commit(); return sections;
}

function htmlToText(content: string) {
  return collapse(decodeEntities(content.replace(/<(script|style|noscript)[^>]*>[\s\S]*?<\/\1>/gi, " ").replace(/<\/?(p|div|section|article|h[1-6]|li|br)[^>]*>/gi, "\n").replace(/<[^>]+>/g, " ")));
}

/** Deterministic, loss-aware extraction for initial NSI text formats. */
export function extractNuruDocument(contentType: string, body: Buffer, fallbackTitle?: string | null): ExtractionResult {
  if (!supportedTextTypes.has(contentType)) return { status: "EXTRACTION_PENDING", title: fallbackTitle ?? null, content: null, sections: [], language: null, extractionMethod: "pending-supported-parser", contentHash: null };
  const original = body.toString("utf8"); const content = contentType === "text/html" ? htmlToText(original) : collapse(original);
  const sections = contentType === "text/markdown" ? markdownSections(content) : textSections(content);
  const title = contentType === "text/markdown" ? sections[0]?.heading ?? fallbackTitle ?? null : fallbackTitle ?? sections[0]?.content.slice(0, 120) ?? null;
  return { status: "EXTRACTED", title, content, sections, language: "en", extractionMethod: `nsi-text-v1:${contentType}`, contentHash: `sha256:${createHash("sha256").update(content).digest("hex")}` };
}
