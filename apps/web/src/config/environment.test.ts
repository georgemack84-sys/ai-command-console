import { describe, expect, it } from 'vitest';

import { parsePublicEnvironment } from './environment-schema';

const valid = {
  NEXT_PUBLIC_APP_NAME: 'Proprium',
  NEXT_PUBLIC_APP_VERSION: '1.0.0',
  NEXT_PUBLIC_API_BASE_URL: 'https://api.example.test',
  NEXT_PUBLIC_ENVIRONMENT: 'test',
};

describe('public environment', () => {
  it('accepts valid public configuration', () =>
    expect(parsePublicEnvironment(valid)).toEqual(valid));

  it.each([
    'NEXT_PUBLIC_APP_NAME',
    'NEXT_PUBLIC_APP_VERSION',
    'NEXT_PUBLIC_API_BASE_URL',
    'NEXT_PUBLIC_ENVIRONMENT',
  ] as const)('rejects missing %s', (key) => {
    expect(() =>
      parsePublicEnvironment({ ...valid, [key]: undefined }),
    ).toThrow();
  });

  it('trims display metadata and rejects whitespace-only application names', () => {
    expect(
      parsePublicEnvironment({
        ...valid,
        NEXT_PUBLIC_APP_NAME: ' Proprium ',
        NEXT_PUBLIC_APP_VERSION: ' 1.0.0-test ',
      }),
    ).toMatchObject({
      NEXT_PUBLIC_APP_NAME: 'Proprium',
      NEXT_PUBLIC_APP_VERSION: '1.0.0-test',
    });
    expect(() =>
      parsePublicEnvironment({ ...valid, NEXT_PUBLIC_APP_NAME: '   ' }),
    ).toThrow();
  });

  it('rejects malformed application versions', () =>
    expect(() =>
      parsePublicEnvironment({
        ...valid,
        NEXT_PUBLIC_APP_VERSION: 'release candidate!',
      }),
    ).toThrow(/NEXT_PUBLIC_APP_VERSION/));

  it('rejects malformed API URLs', () =>
    expect(() =>
      parsePublicEnvironment({
        ...valid,
        NEXT_PUBLIC_API_BASE_URL: 'not-a-url',
      }),
    ).toThrow(/NEXT_PUBLIC_API_BASE_URL/));

  it('rejects unsupported API URL protocols', () =>
    expect(() =>
      parsePublicEnvironment({
        ...valid,
        NEXT_PUBLIC_API_BASE_URL: 'ftp://api.example.test',
      }),
    ).toThrow(/HTTP or HTTPS/));

  it('rejects credentials and secret-bearing URL structures', () => {
    expect(() =>
      parsePublicEnvironment({
        ...valid,
        NEXT_PUBLIC_API_BASE_URL: 'https://username:password@api.example.test',
      }),
    ).toThrow(/must not contain credentials/);
    expect(() =>
      parsePublicEnvironment({
        ...valid,
        NEXT_PUBLIC_API_BASE_URL: 'https://api.example.test?token=public-leak',
      }),
    ).toThrow(/query string or fragment/);
  });

  it('removes one trailing slash without altering a meaningful path', () =>
    expect(
      parsePublicEnvironment({
        ...valid,
        NEXT_PUBLIC_API_BASE_URL: 'https://api.example.test/gateway/',
      }).NEXT_PUBLIC_API_BASE_URL,
    ).toBe('https://api.example.test/gateway'));

  it('rejects unsupported environments', () =>
    expect(() =>
      parsePublicEnvironment({
        ...valid,
        NEXT_PUBLIC_ENVIRONMENT: 'developer-laptop',
      }),
    ).toThrow());

  it('does not admit undeclared values into public configuration', () => {
    const prohibitedPublicName = ['NEXT_PUBLIC_API_', 'SECRET'].join('');
    expect(() =>
      parsePublicEnvironment({
        ...valid,
        [prohibitedPublicName]: 'must-not-be-public',
      }),
    ).toThrow();
  });
});
