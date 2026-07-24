import { describe, expect, it } from 'vitest';
import { defaultAuthenticatedPath, resolveSafeReturnPath } from './return-path';

describe('resolveSafeReturnPath', () => {
  it('keeps an internal path and query', () =>
    expect(resolveSafeReturnPath('/dashboard?tab=recent')).toBe(
      '/dashboard?tab=recent',
    ));
  it.each([
    'https://evil.example',
    '//evil.example',
    '/%2F%2Fevil.example',
    '/login',
    '/%ZZ',
    '/\\evil.example',
  ])('fails closed for %s', (candidate) => {
    expect(resolveSafeReturnPath(candidate)).toBe(defaultAuthenticatedPath);
  });
});
