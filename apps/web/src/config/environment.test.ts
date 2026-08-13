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
  it('rejects missing configuration', () =>
    expect(() =>
      parsePublicEnvironment({ ...valid, NEXT_PUBLIC_APP_NAME: undefined }),
    ).toThrow());
  it('rejects empty and whitespace-only required configuration', () => {
    expect(() =>
      parsePublicEnvironment({ ...valid, NEXT_PUBLIC_APP_NAME: '' }),
    ).toThrow();
    expect(() =>
      parsePublicEnvironment({ ...valid, NEXT_PUBLIC_APP_NAME: '   ' }),
    ).toThrow();
  });
  it('rejects invalid configuration', () =>
    expect(() =>
      parsePublicEnvironment({
        ...valid,
        NEXT_PUBLIC_API_BASE_URL: 'not-a-url',
      }),
    ).toThrow());
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
