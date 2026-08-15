import { describe, expect, it } from 'vitest';

import {
  isThemePreference,
  readThemePreference,
  resolveTheme,
  writeThemePreference,
} from '.';

describe('theme contracts', () => {
  it.each(['light', 'dark', 'system'])('accepts %s', (value) =>
    expect(isThemePreference(value)).toBe(true),
  );
  it.each(['Light', ' dark', '', 'legacy', 1, {}, null])(
    'rejects invalid values',
    (value) => expect(isThemePreference(value)).toBe(false),
  );
  it.each([
    ['light', 'light', 'light'],
    ['light', 'dark', 'light'],
    ['dark', 'light', 'dark'],
    ['dark', 'dark', 'dark'],
    ['system', 'light', 'light'],
    ['system', 'dark', 'dark'],
  ] as const)('resolves %s/%s', (preference, system, expected) =>
    expect(resolveTheme(preference, system)).toBe(expected),
  );
  it('falls back safely when storage is invalid or throws', () => {
    expect(
      readThemePreference({ getItem: () => 'unknown' } as unknown as Storage),
    ).toBe('system');
    expect(
      readThemePreference({
        getItem: () => {
          throw new Error('denied');
        },
      } as unknown as Storage),
    ).toBe('system');
  });
  it('reports write failure without throwing', () => {
    expect(
      writeThemePreference('dark', {
        setItem: () => {
          throw new Error('denied');
        },
      } as unknown as Storage),
    ).toBe(false);
  });
});
