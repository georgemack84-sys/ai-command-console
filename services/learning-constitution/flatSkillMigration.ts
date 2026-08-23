import type { FlatSkillMigration, FlatSkillRecord, SkillNode } from "../../types/learning-constitution/skillGraph";

const now = "1970-01-01T00:00:00.000Z";

/** Converts legacy flat records without changing their identifiers or inventing evidence. */
export const adaptFlatSkills = (flatSkills: readonly FlatSkillRecord[], modelVersion = "skill-graph-v1"): readonly FlatSkillMigration[] => {
  const ids = new Set<string>(); const slugs = new Set<string>();
  return flatSkills.map((flatSkill) => {
    if (!flatSkill.id.trim() || !flatSkill.slug.trim() || !flatSkill.name.trim() || ids.has(flatSkill.id) || slugs.has(flatSkill.slug)) throw new Error("flat skills must have unique non-empty IDs and slugs");
    ids.add(flatSkill.id); slugs.add(flatSkill.slug);
    const skillNode: SkillNode = { id: flatSkill.id, slug: flatSkill.slug, name: flatSkill.name, description: flatSkill.description?.trim() || flatSkill.name, status: "ACTIVE", prerequisites: [], mastery: null, confidence: 0, last_evaluated: null, retention_score: null, evidence: [], created_at: now, updated_at: now, model_version: modelVersion };
    return { flatSkillId: flatSkill.id, skillNode };
  });
};
