import type { FlatSkillRecord, SkillGraphMigrationReport, SkillNode } from "../../types/learning-constitution/skillGraph";
import { adaptFlatSkills } from "./flatSkillMigration";

export const buildSkillGraphMigrationReport = (flatSkills: readonly FlatSkillRecord[], graphNodes: readonly SkillNode[]): SkillGraphMigrationReport => {
  const slugs = new Map<string, FlatSkillRecord[]>();
  for (const skill of flatSkills) slugs.set(skill.slug, [...(slugs.get(skill.slug) ?? []), skill]);
  const duplicated = [...slugs.values()].filter((skills) => skills.length > 1).flat();
  const unique = flatSkills.filter((skill) => (slugs.get(skill.slug)?.length ?? 0) === 1);
  const graphSlugs = new Set(graphNodes.map((node) => node.slug));
  const mappedSource = unique.filter((skill) => graphSlugs.has(skill.slug));
  const unmapped = unique.filter((skill) => !graphSlugs.has(skill.slug));
  const mapped = adaptFlatSkills(mappedSource);
  return { mapped, unmapped, duplicated, manual_review: [...unmapped, ...duplicated], fully_accounted_for: mapped.length + unmapped.length + duplicated.length === flatSkills.length };
};
