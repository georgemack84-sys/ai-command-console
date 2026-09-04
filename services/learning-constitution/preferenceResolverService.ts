import type { ActivePreference, PreferenceResolution, PreferenceStrength } from "../../types/learning-constitution/preferenceLearning";
import type { KnowledgeScopeReference } from "../../types/learning-constitution/knowledgeScope";

const strengthRank: Record<PreferenceStrength, number> = { WEAK: 1, NORMAL: 2, STRONG: 3, EXPLICIT: 4, MANDATORY: 5 };
const scopeKey = (scope: KnowledgeScopeReference) => `${scope.type}:${"id" in scope ? scope.id ?? "" : ""}`;
const applies = (required: readonly KnowledgeScopeReference[], current: readonly KnowledgeScopeReference[]) => required.every((scope) => current.some((item) => scopeKey(item) === scopeKey(scope)));
/** Resolves guidance, never action. Directive precedence and exceptions are evaluated before preference strength. */
export class PreferenceResolverService {
  resolve(input: Readonly<{ ownerId: string; activeScopes: readonly KnowledgeScopeReference[]; preferences: readonly ActivePreference[]; applicableExceptionIds: readonly string[]; explicitHumanDirective?: string }>): PreferenceResolution {
    if (input.explicitHumanDirective?.trim()) return { status: "BYPASSED", reason: "EXPLICIT_DIRECTIVE", guidance: input.explicitHumanDirective, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
    const applicable = input.preferences.filter((preference) => preference.candidate.ownerId === input.ownerId && applies(preference.candidate.scope, input.activeScopes) && !preference.candidate.exceptions.some((exception) => input.applicableExceptionIds.includes(exception.exceptionId) && applies(exception.scope, input.activeScopes)));
    if (!applicable.length) return { status: "BYPASSED", reason: "NO_APPLICABLE_PREFERENCE", persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
    const ranked = [...applicable].sort((a, b) => b.candidate.scope.length - a.candidate.scope.length || strengthRank[b.candidate.strength] - strengthRank[a.candidate.strength] || b.candidate.confidence - a.candidate.confidence || b.activatedAt.localeCompare(a.activatedAt));
    const first = ranked[0]!; const second = ranked[1]; if (second && second.candidate.scope.length === first.candidate.scope.length && strengthRank[second.candidate.strength] === strengthRank[first.candidate.strength] && second.candidate.confidence === first.candidate.confidence && second.activatedAt === first.activatedAt) return { status: "DEFERRED", reason: "TIE_REQUIRES_REVIEW", persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
    return { status: "APPLIED", reason: "PREFERENCE_SELECTED", preferenceId: first.preferenceId, guidance: `${first.candidate.polarity}: ${first.candidate.preferredOption}`, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
  }
}
