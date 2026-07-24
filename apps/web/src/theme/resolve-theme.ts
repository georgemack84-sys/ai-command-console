import type { ResolvedTheme, ThemePreference } from './contracts';

export function resolveTheme(
  preference: ThemePreference,
  systemTheme: ResolvedTheme,
): ResolvedTheme {
  return preference === 'system' ? systemTheme : preference;
}
