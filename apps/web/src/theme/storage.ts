import { DEFAULT_THEME_PREFERENCE, THEME_STORAGE_KEY } from './constants';
import { isThemePreference, type ThemePreference } from './contracts';

export function readThemePreference(
  storage: Storage | undefined = globalThis.localStorage,
): ThemePreference {
  try {
    const value = storage?.getItem(THEME_STORAGE_KEY);
    return isThemePreference(value) ? value : DEFAULT_THEME_PREFERENCE;
  } catch {
    return DEFAULT_THEME_PREFERENCE;
  }
}

export function writeThemePreference(
  preference: ThemePreference,
  storage: Storage | undefined = globalThis.localStorage,
): boolean {
  try {
    storage?.setItem(THEME_STORAGE_KEY, preference);
    return Boolean(storage);
  } catch {
    return false;
  }
}
